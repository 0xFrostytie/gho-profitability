import { fetchJson, finite, record } from './http';
import type { MarketData, MarketRow } from './types';

export const AAVE_API = 'https://api.v3.aave.com/graphql';
const GHO_ETH = '0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f';
const GHO_MONAD = '0xfc421ad3c883bf9e7c4f42de845c4e4405799e73';
const MARKETS = [
  {
    address: '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2',
    name: 'Ethereum Core',
    chainId: 1,
    token: GHO_ETH,
  },
  {
    address: '0x4e033931ad43597d96d6bcc25c280717730b58b1',
    name: 'Ethereum Prime',
    chainId: 1,
    token: GHO_ETH,
  },
  {
    address: '0xae05cd22df81871bc7cc2a04becfb516bfe332c8',
    name: 'Horizon',
    chainId: 1,
    token: GHO_ETH,
  },
  {
    address: '0x69a5f9ad4f96ebf0a0c792dd42a01cc5c0102fef',
    name: 'Monad',
    chainId: 143,
    token: GHO_MONAD,
  },
];
export const MARKET_QUERY = `query LiveGhoMarkets {
  markets(request:{chainIds:[1,143]}) {
    address chain{chainId}
    reserves(request:{reserveType:BORROW}) {
      underlyingToken{address decimals}
      borrowInfo{apy{value} total{amount{value}} reserveFactor{value} borrowCap{amount{value}} utilizationRate{value}}
    }
  }
  sghoVault(request:{chainId:1}) {totalAssets{amount{value}} targetRate{value} paused}
}`;
const valueOf = (value: unknown) => finite(record(value).value);
const amountOf = (value: unknown) => valueOf(record(value).amount);
const nonnegative = (number: number) => {
  if (number < 0) throw new Error('Negative market amount');
  return number;
};

/** Matches Aave interface's display convention; not a promise of future compounding. */
export const savingsDisplayApy = (apr: number) =>
  Math.expm1(12 * Math.log1p(apr / 12));
export const borrowApyFromApr = (apr: number) =>
  Math.expm1(31_536_000 * Math.log1p(apr / 31_536_000));
export function normalizeMarkets(raw: unknown): MarketData {
  const payload = record(raw);
  if (payload.errors) throw new Error('Aave API returned a GraphQL error');
  const data = record(payload.data);
  if (!Array.isArray(data.markets)) throw new Error('Missing Aave markets');
  const markets: MarketRow[] = MARKETS.map((expected) => {
    const matches = (data.markets as unknown[])
      .map(record)
      .filter(
        (m) =>
          typeof m.address === 'string' &&
          m.address.toLowerCase() === expected.address &&
          record(m.chain).chainId === expected.chainId,
      );
    if (matches.length !== 1 || !Array.isArray(matches[0].reserves))
      throw new Error('Missing or duplicate Aave market');
    const reserves = matches[0].reserves
      .map(record)
      .filter(
        (r) =>
          record(r.underlyingToken).address?.toString().toLowerCase() ===
          expected.token,
      );
    if (
      reserves.length !== 1 ||
      record(reserves[0].underlyingToken).decimals !== 18
    )
      throw new Error('Missing GHO reserve or changed decimals');
    const borrow = record(reserves[0].borrowInfo);
    const borrowedGho = nonnegative(amountOf(borrow.total)),
      borrowCapGho = nonnegative(amountOf(borrow.borrowCap));
    const reserveFactor = valueOf(borrow.reserveFactor);
    if (reserveFactor < 0 || reserveFactor > 1)
      throw new Error('Invalid reserve factor');
    return {
      name: expected.name,
      chainId: expected.chainId,
      address: expected.address,
      borrowedGho,
      borrowCapGho,
      capUsage: borrowCapGho > 0 ? borrowedGho / borrowCapGho : null,
      borrowApy: nonnegative(valueOf(borrow.apy)),
      reserveFactor,
      utilization: nonnegative(valueOf(borrow.utilizationRate)),
    };
  });
  const savings = record(data.sghoVault);
  const apr = nonnegative(valueOf(savings.targetRate)),
    balance = nonnegative(amountOf(savings.totalAssets));
  if (typeof savings.paused !== 'boolean')
    throw new Error('Missing vault status');
  const apy = savingsDisplayApy(apr);
  return {
    source: {
      name: 'Aave · Official API',
      url: 'https://app.aave.com/markets/',
      apiUrl: AAVE_API,
    },
    coverage: 'four-markets',
    block: null,
    markets,
    savingsApr: apr,
    savingsDisplayApy: apy,
    savingsGho: balance,
    savingsAnnualCostGho: balance * apr,
    savingsPaused: savings.paused,
    matchedApySpread: markets[0].borrowApy - apy,
  };
}

const PROVIDER = '0x0a16f2fcc0d44fae41cc54e079281d84a363becd';
const SGHO = '0xe1753f2e00940cc31213dd92013cf019dfe4ca1d';
const RPCS = ['https://ethereum-rpc.publicnode.com', 'https://eth.drpc.org'];
export function decodeWords(hex: unknown, count: number): bigint[] {
  if (
    typeof hex !== 'string' ||
    !/^0x[0-9a-f]+$/i.test(hex) ||
    hex.length !== 2 + count * 64
  )
    throw new Error('Invalid ABI response');
  return Array.from({ length: count }, (_, i) =>
    BigInt(`0x${hex.slice(2 + i * 64, 2 + (i + 1) * 64)}`),
  );
}
async function rpc(url: string, body: object) {
  return fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
export async function fetchOnchainFallback(): Promise<MarketData> {
  for (const endpoint of RPCS) {
    try {
      const head = record(
        await rpc(endpoint, {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
        }),
      );
      if (head.error) throw new Error('RPC block unavailable');
      const block = record(head.result);
      if (
        typeof block.number !== 'string' ||
        typeof block.timestamp !== 'string' ||
        !/^0x[0-9a-f]+$/i.test(block.number) ||
        !/^0x[0-9a-f]+$/i.test(block.timestamp)
      )
        throw new Error('Invalid block');
      const timestamp = new Date(
        Number(BigInt(block.timestamp)) * 1000,
      ).toISOString();
      if (Math.abs(Date.now() - Date.parse(timestamp)) > 300_000)
        throw new Error('RPC block is stale');
      const addressWord = GHO_ETH.slice(2).padStart(64, '0');
      const calls = [
        { to: PROVIDER, data: `0x35ea6a75${addressWord}` },
        { to: PROVIDER, data: `0x46fbe558${addressWord}` },
        { to: SGHO, data: '0xcc8fd393' },
        { to: SGHO, data: '0x01e1d114' },
        { to: PROVIDER, data: `0x3e150141${addressWord}` },
      ];
      const raw = await rpc(
        endpoint,
        calls.map((call, index) => ({
          jsonrpc: '2.0',
          id: index + 2,
          method: 'eth_call',
          params: [call, block.number],
        })),
      );
      if (!Array.isArray(raw) || raw.length !== 5)
        throw new Error('Invalid RPC batch');
      const responses = raw.map(record);
      const get = (id: number, count: number) => {
        const match = responses.filter((r) => r.id === id);
        if (match.length !== 1 || match[0].error)
          throw new Error('Missing RPC result');
        return decodeWords(match[0].result, count);
      };
      const reserve = get(2, 12),
        caps = get(3, 2),
        configuration = get(6, 10);
      if (configuration[0] !== BigInt(18) || configuration[4] > BigInt(10000))
        throw new Error('Unexpected GHO reserve configuration');
      const apr = Number(reserve[6]) / 1e27,
        borrowed = Number(reserve[4]) / 1e18,
        cap = Number(caps[0]);
      const savingsApr = Number(get(4, 1)[0]) / 10000,
        savingsGho = Number(get(5, 1)[0]) / 1e18;
      const apy = borrowApyFromApr(apr),
        savingsApy = savingsDisplayApy(savingsApr);
      return {
        source: {
          name: 'Ethereum · Aave contract reads',
          url: `https://etherscan.io/block/${BigInt(block.number).toString()}`,
          apiUrl: endpoint,
        },
        coverage: 'ethereum-core-only',
        block: { number: BigInt(block.number).toString(), timestamp },
        markets: [
          {
            name: 'Ethereum Core',
            chainId: 1,
            address: MARKETS[0].address,
            borrowApy: apy,
            borrowedGho: borrowed,
            borrowCapGho: cap,
            capUsage: cap > 0 ? borrowed / cap : null,
            reserveFactor: Number(configuration[4]) / 10000,
            utilization: null,
          },
        ],
        savingsApr,
        savingsDisplayApy: savingsApy,
        savingsGho,
        savingsAnnualCostGho: savingsGho * savingsApr,
        savingsPaused: null,
        matchedApySpread: apy - savingsApy,
      };
    } catch {
      /* Only the independently verified second RPC is tried; no fabricated fallback values. */
    }
  }
  throw new Error('Aave API and Ethereum RPC sources are unavailable');
}
export async function fetchMarkets(): Promise<MarketData> {
  try {
    return normalizeMarkets(
      await fetchJson(AAVE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: MARKET_QUERY }),
      }),
    );
  } catch {
    return fetchOnchainFallback();
  }
}
