import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Exercise authored TypeScript directly without another runtime dependency or a browser.
const dir = mkdtempSync(join(tmpdir(), 'gho-live-test-'));
writeFileSync(join(dir, 'package.json'), ' {"type":"module"}');
for (const name of [
  'cache',
  'http',
  'tokenlogic',
  'markets',
  'polling',
  'client',
  'service',
]) {
  const input = readFileSync(
    new URL(`../lib/live/${name}.ts`, import.meta.url),
    'utf8',
  );
  const result = ts
    .transpileModule(input, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    })
    .outputText.replace(/from '(\.\/[^']+)'/g, "from '$1.js'");
  writeFileSync(join(dir, `${name}.js`), result);
}
after(() => rmSync(dir, { recursive: true, force: true }));
const get = (name) => import(pathToFileURL(join(dir, `${name}.js`)).href);
const [
  { normalizeFinancials, normalizeQuarters },
  { normalizeMarkets, decodeWords, fetchOnchainFallback },
  { createLiveCache },
  { startPolling },
  { retainAfterFailure },
  { applyFinancialFreshness },
] = await Promise.all(
  ['tokenlogic', 'markets', 'cache', 'polling', 'client', 'service'].map(get),
);
const fixture = JSON.parse(
  readFileSync(
    new URL('./fixtures/live-source-sample.json', import.meta.url),
    'utf8',
  ),
);
const observed = new Date('2026-09-05T18:00:00Z');
const clone = structuredClone;

const financial = () => normalizeFinancials(fixture.revenue, fixture.expenses);
test('Provider metrics reconcile exactly; removing GSM does not become full net', () => {
  const result = financial();
  assert.ok(Math.abs(result.reportedBalanceAnnualizedUsd - 2221490.901) < 0.01);
  assert.ok(
    Math.abs(result.gsmExcludedBalanceAnnualizedUsd + 1001128.322) < 0.01,
  );
  assert.equal(
    result.revenueAnnualizedUsd -
      result.gsmRevenueAnnualizedUsd -
      result.expenseAnnualizedUsd,
    result.gsmExcludedBalanceAnnualizedUsd,
  );
  assert.equal(result.sourceUpdatedAt, '2026-09-05T00:15:17.144Z');
});
test('Missing, duplicate and inconsistent financial metrics are rejected', () => {
  for (const value of [null, undefined, '', NaN, Infinity]) {
    const bad = clone(fixture.revenue);
    bad.rows.find(
      (r) => r.metric_key === 'annualised_revenue_90_day_average',
    ).value = value;
    assert.throws(() => normalizeFinancials(bad, fixture.expenses));
  }
  const bad = clone(fixture.revenue);
  bad.rows.push(
    bad.rows.find((r) => r.metric_key === 'annualised_revenue_90_day_average'),
  );
  assert.throws(() => normalizeFinancials(bad, fixture.expenses), /duplicated/);
  const mismatch = clone(fixture.expenses);
  mismatch.rows.find((r) => r.metric_key === 'annualised_expenses_90d').value =
    1;
  assert.throws(
    () => normalizeFinancials(fixture.revenue, mismatch),
    /reconcile/,
  );
});
test('Actual quarterly statements preserve missing costs and distinguish revenue lines', () => {
  const { rows } = normalizeQuarters(fixture.quarters, observed);
  assert.equal(rows.length, 13);
  assert.equal(rows[0].partial, true);
  assert.equal(rows[1].partial, false);
  assert.equal(rows[1].grossBorrowFeesUsd, 997601.377400738);
  assert.equal(rows[1].facilitatorYieldUsd, 402096.3967398646);
  assert.equal(rows[1].costs.sGHO, 847365);
  assert.equal(rows[1].costs['GHO CEX'], undefined);
  assert.equal(rows.at(-1).facilitatorYieldUsd, null);
  assert.ok(rows.every((r) => !('Aave Umbrella' in r.costs)));
});
test('Whole missing quarters and new quarters are explicitly unreported', () => {
  const raw = clone(fixture.quarters);
  raw.rows = raw.rows.filter((r) => r.block_period.value !== '2025-04-01');
  const { rows } = normalizeQuarters(raw, new Date('2026-10-02T00:00:00Z'));
  const missing = rows.find((r) => r.periodStart === '2025-04-01');
  assert.equal(missing.sourceMissing, true);
  assert.equal(missing.grossBorrowFeesUsd, null);
  assert.deepEqual(missing.costs, {});
  assert.equal(rows[0].label, 'Q4 2026');
  assert.equal(rows[0].partial, true);
  assert.equal(rows[0].sourceMissing, true);
});
test('Costs retain refunds and new GHO categories; duplicate rows fail', () => {
  const raw = clone(fixture.quarters),
    base = raw.rows.find(
      (r) =>
        r.statement === 'Income Statement' &&
        r.statement_section === 'Expenses' &&
        r.line_category === 'GHO',
    );
  raw.rows.push({ ...base, line_item: 'New GHO cost', value_usd: 125 });
  const item = normalizeQuarters(raw, observed).rows.find(
    (r) => r.periodStart === base.block_period.value,
  );
  assert.equal(item.costs['New GHO cost'], -125);
  raw.rows.push(raw.rows.at(-1));
  assert.throws(() => normalizeQuarters(raw, observed), /Duplicate/);
});
test('Official market payload keeps APR/APY, debt, cap and reserve capture distinct', () => {
  const result = normalizeMarkets(fixture.markets);
  assert.equal(result.markets.length, 4);
  assert.equal(result.savingsApr, 0.045);
  assert.ok(
    Math.abs(result.savingsDisplayApy - ((1 + 0.045 / 12) ** 12 - 1)) < 1e-12,
  );
  assert.equal(result.savingsAnnualCostGho, result.savingsGho * 0.045);
  assert.equal(
    result.markets[0].capUsage,
    result.markets[0].borrowedGho / result.markets[0].borrowCapGho,
  );
  assert.notEqual(result.markets[0].capUsage, result.markets[0].utilization);
  assert.equal(result.markets[0].reserveFactor, 1);
  assert.equal(result.markets[1].reserveFactor, 0.1);
  assert.ok(result.matchedApySpread < 0);
  const bad = clone(fixture.markets);
  bad.data.markets[0].reserves[0].underlyingToken.decimals = 6;
  assert.throws(() => normalizeMarkets(bad), /decimals/);
});
test('RPC fallback pins reads to one block, handles reordered responses and correct units', async () => {
  const original = globalThis.fetch,
    calls = [];
  const encoded = (values) =>
    '0x' + values.map((v) => BigInt(v).toString(16).padStart(64, '0')).join('');
  const values = {
    2: [0, 0, 0, 0, 110n * 10n ** 24n, 0, 4n * 10n ** 25n, 0, 0, 0, 0, 0],
    3: [150000000, 0],
    4: [450],
    5: [160n * 10n ** 24n],
    6: [18, 0, 0, 0, 10000, 0, 0, 0, 0, 0],
  };
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body);
    if (!Array.isArray(body))
      return Response.json({
        jsonrpc: '2.0',
        id: 1,
        result: {
          number: '0x1234',
          timestamp: '0x' + Math.floor(Date.now() / 1000).toString(16),
        },
      });
    return Response.json(
      body
        .map((x) => ({
          id: x.id,
          jsonrpc: '2.0',
          result: encoded(values[x.id]),
        }))
        .reverse(),
    );
  };
  try {
    const result = await fetchOnchainFallback();
    assert.equal(result.coverage, 'ethereum-core-only');
    assert.equal(result.markets[0].borrowedGho, 110000000);
    assert.equal(result.markets[0].borrowCapGho, 150000000);
    assert.equal(result.savingsApr, 0.045);
    assert.equal(result.savingsGho, 160000000);
    assert.equal(result.savingsPaused, null);
    assert.ok(calls[1].every((call) => call.params[1] === '0x1234'));
    assert.throws(() => decodeWords('0x12', 1), /ABI/);
  } finally {
    globalThis.fetch = original;
  }
});
test('Cache deduplicates, refreshes after TTL and does not relabel stale timestamps', async () => {
  let now = 0,
    calls = 0,
    fail = false;
  const entries = new Map();
  const read = createLiveCache(
    {
      get: async (key) => entries.get(key),
      put: async (key, value) => {
        entries.set(key, value);
      },
    },
    { ttlMs: 60, maxStaleMs: 240, now: () => now },
  );
  const loader = async () => {
    calls++;
    await Promise.resolve();
    if (fail) throw Error('offline');
    return calls;
  };
  const [first, other] = await Promise.all([
    read('feed', loader),
    read('feed', loader),
  ]);
  assert.equal(calls, 1);
  assert.equal(first.data, other.data);
  now = 59;
  assert.equal((await read('feed', loader)).fetchedAt, first.fetchedAt);
  assert.equal(calls, 1);
  now = 61;
  const fresh = await read('feed', loader);
  assert.equal(calls, 2);
  assert.notEqual(fresh.fetchedAt, first.fetchedAt);
  fail = true;
  now = 130;
  const stale = await read('feed', loader);
  assert.equal(stale.status, 'stale');
  assert.equal(stale.fetchedAt, fresh.fetchedAt);
  now = 302;
  const missing = await read('feed', loader);
  assert.equal(missing.status, 'unavailable');
  assert.equal(missing.data, null);
  assert.equal(missing.fetchedAt, null);
});
test('Source freshness and browser outage expiry are independent of successful transport', () => {
  const feed = {
    data: financial(),
    status: 'live',
    fetchedAt: observed.toISOString(),
    checkedAt: observed.toISOString(),
    error: null,
  };
  assert.equal(
    applyFinancialFreshness(feed, observed.getTime()).status,
    'live',
  );
  assert.equal(
    applyFinancialFreshness(feed, observed.getTime() + 36 * 3600000).status,
    'stale',
  );
  const live = { version: 1, financials: feed, quarters: feed, markets: feed };
  const retained = retainAfterFailure(live, observed.getTime() + 1000);
  assert.equal(retained.markets.fetchedAt, feed.fetchedAt);
  assert.equal(retained.markets.status, 'stale');
  const expired = retainAfterFailure(live, observed.getTime() + 86400001);
  assert.equal(expired.markets.data, null);
  assert.equal(expired.markets.status, 'unavailable');
  assert.equal(retainAfterFailure(null), null);
});
test('Polling refreshes automatically and manually, pauses when hidden and never overlaps', async () => {
  let visible = true,
    listener,
    tick,
    loads = 0,
    resolve,
    removed = false,
    cancelled = false;
  const poller = startPolling(
    () => {
      loads++;
      return new Promise((r) => {
        resolve = r;
      });
    },
    {
      intervalMs: 120000,
      isVisible: () => visible,
      subscribeVisibility: (fn) => {
        listener = fn;
        return () => {
          removed = true;
        };
      },
      schedule: (fn, ms) => {
        tick = fn;
        assert.equal(ms, 120000);
        return 1;
      },
      cancel: () => {
        cancelled = true;
      },
    },
  );
  assert.equal(loads, 1);
  tick();
  const pending = poller.refresh();
  assert.equal(loads, 1);
  resolve();
  await pending;
  tick();
  assert.equal(loads, 2);
  resolve();
  await poller.refresh();
  visible = false;
  tick();
  listener();
  await poller.refresh();
  assert.equal(loads, 2);
  visible = true;
  listener();
  assert.equal(loads, 3);
  resolve();
  await poller.refresh();
  await Promise.resolve();
  const manual = poller.refresh();
  assert.equal(loads, 4);
  resolve();
  await manual;
  poller.stop();
  tick();
  listener();
  assert.equal(loads, 4);
  assert.ok(cancelled && removed);
});
