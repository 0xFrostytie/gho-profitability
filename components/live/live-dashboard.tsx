'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { retainAfterFailure } from '@/lib/live/client';
import { startPolling } from '@/lib/live/polling';
import type { Feed } from '@/lib/live/cache';
import type { LiveData, QuarterRow, SourceReference } from '@/lib/live/types';

const dollars = (value: number | null, signed = false) =>
  value === null
    ? 'Unreported'
    : `${value < 0 ? '−' : signed && value > 0 ? '+' : ''}$${Math.abs(value) >= 1e6 ? (Math.abs(value) / 1e6).toFixed(2) + 'M' : Math.abs(value) >= 1e3 ? (Math.abs(value) / 1e3).toFixed(2) + 'K' : Math.abs(value).toFixed(2)}`;
const amount = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
const percent = (value: number | null) =>
  value === null ? 'Unreported' : `${(value * 100).toFixed(2)}%`;
const dateTime = (value: string) =>
  new Date(value)
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d+Z$/, ' UTC');
const color = (value: number) => (value >= 0 ? 'positive' : 'negative');

function Source({ source }: { source: SourceReference }) {
  return (
    <a
      className="source-link"
      href={source.url}
      target="_blank"
      rel="noreferrer"
    >
      {source.name} <ArrowUpRight size={14} />
    </a>
  );
}
function Status({
  feed,
  connectionError,
}: {
  feed: Feed<unknown> | undefined;
  connectionError: boolean;
}) {
  const status = connectionError
    ? feed?.data
      ? 'stale'
      : 'unavailable'
    : feed?.status;
  return (
    <div className="feed-status">
      <span className={`feed-indicator ${status || 'loading'}`} />
      <strong>
        {!feed && !connectionError
          ? 'Fetching source…'
          : status === 'live'
            ? 'Source connected'
            : status === 'stale'
              ? 'Last available data'
              : connectionError
                ? 'Data connection unavailable'
                : 'Source unavailable'}
      </strong>
      {feed?.fetchedAt && (
        <span className="feed-observation">
          Fetched{' '}
          <time dateTime={feed.fetchedAt}>{dateTime(feed.fetchedAt)}</time>
        </span>
      )}
      {feed?.error && <p>{feed.error}</p>}
    </div>
  );
}
function Empty({ message }: { message: string }) {
  return (
    <div className="live-empty">
      <p>{message}</p>
      <a className="source-link" href="#audit">
        Read the dated research audit <ArrowUpRight size={14} />
      </a>
    </div>
  );
}
function QuarterRevenue({ rows }: { rows: QuarterRow[] }) {
  return (
    <Table className="research-table live-quarter-table">
      <TableHeader>
        <TableRow>
          <TableHead>Quarter</TableHead>
          <TableHead>Gross borrow fees</TableHead>
          <TableHead>Facilitator yield</TableHead>
          <TableHead>
            GSM interest / swap fees
            <br />
            <span className="column-note">
              Excluded from the requested numerator
            </span>
          </TableHead>
          <TableHead>Full net GHO income</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((q) => (
          <TableRow
            key={q.periodStart}
            className={q.partial ? 'partial-row' : ''}
          >
            <TableCell className="period-cell">
              {q.label}
              {q.sourceMissing && (
                <span className="partial-label">source missing</span>
              )}
              {q.partial && <span className="partial-label">in progress</span>}
            </TableCell>
            <TableCell className="number">
              {dollars(q.grossBorrowFeesUsd)}
            </TableCell>
            <TableCell className="number">
              {dollars(q.facilitatorYieldUsd)}
            </TableCell>
            <TableCell className="number muted">
              {dollars(q.gsmInterestUsd)} / {dollars(q.gsmSwapFeesUsd)}
            </TableCell>
            <TableCell>
              <span className="unknown">Unverified</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
function QuarterCosts({ rows }: { rows: QuarterRow[] }) {
  const preferred = [
    'sGHO',
    'GHO Liquidity',
    'GHO CEX',
    'stkGHO Emissions',
    'ALC GHO liquidity payment',
  ];
  const present = new Set(rows.flatMap((q) => Object.keys(q.costs)));
  const columns = [
    ...preferred,
    ...[...present].filter((x) => !preferred.includes(x)).sort(),
  ];
  const labels: Record<string, string> = {
    sGHO: 'sGHO / Merit transfers',
    'GHO Liquidity': 'Liquidity transfers',
    'GHO CEX': 'CEX / maker transfers',
    'stkGHO Emissions': 'stkGHO AAVE accrual',
    'ALC GHO liquidity payment': 'Other ALC GHO payments',
  };
  return (
    <Table className="research-table live-cost-table">
      <TableHeader>
        <TableRow>
          <TableHead>Quarter</TableHead>
          {columns.map((c) => (
            <TableHead key={c}>{labels[c] || c}</TableHead>
          ))}
          <TableHead>
            Complete Merit /<br />
            discount / loss / GSM costs
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((q) => (
          <TableRow key={q.periodStart}>
            <TableCell className="period-cell">
              {q.label}
              {q.sourceMissing && (
                <span className="partial-label">source missing</span>
              )}
              {q.partial && <span className="partial-label">in progress</span>}
            </TableCell>
            {columns.map((c) => (
              <TableCell className="number" key={c}>
                {dollars(q.costs[c] ?? null)}
              </TableCell>
            ))}
            <TableCell>
              <span className="unknown">Unverified</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function LiveDashboard() {
  const [data, setData] = useState<LiveData | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const poller = useRef<ReturnType<typeof startPolling> | null>(null);
  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;
    const load = async () => {
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 65_000);
      try {
        const response = await fetch('/api/live', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error('The live-data service did not respond.');
        const next: unknown = await response.json();
        if (
          !next ||
          typeof next !== 'object' ||
          !('version' in next) ||
          next.version !== 1 ||
          !('financials' in next) ||
          !('quarters' in next) ||
          !('markets' in next)
        )
          throw new Error('The data service returned an unexpected response.');
        if (mounted) {
          setData(next as LiveData);
          setError(null);
        }
      } catch {
        if (mounted) {
          setData((previous) => retainAfterFailure(previous));
          setError(
            'Could not reach the live-data service. Check your connection and try Refresh data. Any retained values keep their original timestamps.',
          );
        }
      } finally {
        clearTimeout(timeout);
        if (mounted) setBusy(false);
      }
    };
    poller.current = startPolling(load, {
      intervalMs: 120_000,
      isVisible: () => document.visibilityState !== 'hidden',
      subscribeVisibility: (listener) => {
        document.addEventListener('visibilitychange', listener);
        return () => document.removeEventListener('visibilitychange', listener);
      },
    });
    return () => {
      mounted = false;
      poller.current?.stop();
      controller?.abort();
    };
  }, []);
  const refresh = () => {
    setBusy(true);
    void poller.current?.refresh().finally(() => setBusy(false));
  };
  const financial = data?.financials.data,
    quarters = data?.quarters.data,
    market = data?.markets.data;
  const core = market?.markets.find((m) => m.name === 'Ethereum Core');
  return (
    <div id="live" className="live-dashboard">
      <div className="live-heading">
        <div>
          <div className="eyebrow">
            <span className="signal" /> AUTOMATICALLY UPDATED DATA
          </div>
          <h1>
            GHO economics,
            <br />
            from the source.
          </h1>
          <p>
            Current rates, reported financials and quarterly evidence. Gross
            interest and complete net income stay separate.
          </p>
        </div>
        <div className="refresh-controls">
          <Button
            variant="outline"
            size="lg"
            onClick={refresh}
            disabled={busy}
            className="refresh-button"
          >
            <RefreshCw size={16} className={busy ? 'refresh-spin' : ''} />
            {busy ? 'Fetching…' : 'Refresh data'}
          </Button>
          <span>Refreshes every 2 minutes while visible</span>
          {data && <span>Last checked {dateTime(data.requestedAt)}</span>}
        </div>
      </div>
      {error && (
        <p className="live-alert" role="alert">
          {error}
        </p>
      )}
      <section className="live-financials" aria-labelledby="financial-title">
        <div className="table-topline">
          <h2 id="financial-title">Reported GHO financials</h2>
          <Status feed={data?.financials} connectionError={Boolean(error)} />
        </div>
        {!data && !error ? (
          <div className="live-loading">
            <Skeleton className="h-36 w-full" />
            <p>
              Fetching TokenLogic’s financial metrics and source reporting
              dates…
            </p>
          </div>
        ) : !financial ? (
          <Empty
            message={
              error
                ? 'The site’s data connection is unavailable. Current financial metrics could not be checked.'
                : 'Financial metrics are unavailable. The site will retry automatically; a previous research figure is not being presented as live.'
            }
          />
        ) : (
          <>
            <p className="live-source-line">
              <Source source={financial.source} />
              <span>{financial.windowLabel}</span>
              <span>
                Provider updated{' '}
                <time dateTime={financial.sourceUpdatedAt}>
                  {dateTime(financial.sourceUpdatedAt)}
                </time>
              </span>
            </p>
            <div className="metrics">
              <div className="metric">
                <span>Broader reported balance</span>
                <strong
                  className={color(financial.reportedBalanceAnnualizedUsd)}
                >
                  {dollars(financial.reportedBalanceAnnualizedUsd, true)}
                  <span>/yr</span>
                </strong>
                <p>Includes GSM revenue and tracked expense categories.</p>
              </div>
              <div className="metric">
                <span>Balance excluding GSM</span>
                <strong
                  className={color(financial.gsmExcludedBalanceAnnualizedUsd)}
                >
                  {dollars(financial.gsmExcludedBalanceAnnualizedUsd, true)}
                  <span>/yr</span>
                </strong>
                <p>
                  GSM income removed; facilitator deposit yield remains
                  included.
                </p>
              </div>
              <div className="metric">
                <span>Complete net profitability</span>
                <strong className="unresolved">Unverified</strong>
                <p>
                  Incentive reconciliation, subsidies and remaining costs are
                  still incomplete.
                </p>
              </div>
            </div>
            <div className="live-ledger">
              <div>
                <span>Total reported revenue</span>
                <strong>{dollars(financial.revenueAnnualizedUsd)}</strong>
              </div>
              <div>
                <span>GSM income included above</span>
                <strong>{dollars(financial.gsmRevenueAnnualizedUsd)}</strong>
              </div>
              <div>
                <span>Reported expenses</span>
                <strong>{dollars(financial.expenseAnnualizedUsd)}</strong>
              </div>
            </div>
            <p className="table-note">
              All amounts are annualized USD, not realized annual profit. The
              diagnostic equals reported revenue minus GSM income minus reported
              expenses. Facilitator deposit yield remains included, so this is
              not borrow-only income or a verified all-facilitator net figure.
              The provider labels the window 90 days; its exact start/end and
              accounting differences with the quarterly statements remain
              unreconciled. Missing costs are not assumed zero.
            </p>
          </>
        )}
      </section>

      <section id="live-markets" className="section">
        <div className="table-topline">
          <div>
            <h2>Current rates and savings</h2>
            <p className="live-subtitle">
              Interest rates fetched from Aave; APR and APY are explicitly
              distinguished.
            </p>
          </div>
          <Status feed={data?.markets} connectionError={Boolean(error)} />
        </div>
        {!data && !error ? (
          <Skeleton className="h-64 w-full" />
        ) : !market ? (
          <Empty
            message={
              error
                ? 'The site’s data connection is unavailable. Aave’s current rates could not be checked.'
                : 'Aave’s market data and the on-chain fallback are unavailable. Current rates are unknown until a source responds.'
            }
          />
        ) : (
          <>
            <p className="live-source-line">
              <Source source={market.source} />
              {market.block ? (
                <span>
                  Block {market.block.number} ·{' '}
                  {dateTime(market.block.timestamp)}
                </span>
              ) : (
                <span>
                  Aave’s API supplies no block timestamp; the fetch time above
                  is the observation time.
                </span>
              )}
            </p>
            {market.coverage === 'ethereum-core-only' && (
              <p className="live-alert">
                Using verified Ethereum contract reads while the Aave API is
                unavailable. Prime, Horizon and Monad are not included in this
                fallback.
              </p>
            )}
            <div className="live-market-layout">
              <div>
                <Table className="research-table live-market-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Market</TableHead>
                      <TableHead>Borrow APY</TableHead>
                      <TableHead>Debt · GHO</TableHead>
                      <TableHead>Borrow-cap usage</TableHead>
                      <TableHead>Market utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {market.markets.map((m) => (
                      <TableRow key={m.address}>
                        <TableCell className="period-cell">{m.name}</TableCell>
                        <TableCell className="number">
                          {percent(m.borrowApy)}
                        </TableCell>
                        <TableCell className="number">
                          {amount(m.borrowedGho)}
                        </TableCell>
                        <TableCell className="number">
                          {percent(m.capUsage)}
                        </TableCell>
                        <TableCell className="number">
                          {percent(m.utilization)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="table-note">
                  Cap usage is debt divided by the borrow cap. Market
                  utilization has a different denominator. Native Core GHO is
                  minted on demand. Rates on other markets are borrower rates,
                  not a claim that the DAO captures every borrower payment.
                </p>
              </div>
              <div className="live-savings">
                <span className="label">GHO SAVINGS · ETHEREUM</span>
                <div>
                  <strong>{percent(market.savingsApr)}</strong>
                  <span>configured APR</span>
                </div>
                <p>
                  {percent(market.savingsDisplayApy)} display APY using Aave’s
                  monthly-compounding convention.
                </p>
                <dl>
                  <dt>Depositor claims</dt>
                  <dd>{amount(market.savingsGho)} GHO</dd>
                  <dt>Annual cost at a fixed balance</dt>
                  <dd>{amount(market.savingsAnnualCostGho)} GHO</dd>
                </dl>
                {market.savingsPaused === null && (
                  <p>Pause status is unverified in the contract fallback.</p>
                )}
                {market.savingsPaused === true && (
                  <p className="live-alert">
                    Aave reports this savings vault as paused.
                  </p>
                )}
              </div>
            </div>
            <div className="live-spread">
              <div>
                <span>Core borrow APY − savings display APY</span>
                <strong className={color(market.matchedApySpread)}>
                  {market.matchedApySpread >= 0 ? '+' : '−'}
                  {Math.abs(market.matchedApySpread * 100).toFixed(2)}{' '}
                  <small>pp</small>
                </strong>
              </div>
              <p>
                {core &&
                  `${percent(core.borrowApy)} − ${percent(market.savingsDisplayApy)}.`}{' '}
                This is a matched-unit yield comparison, not the DAO’s aggregate
                margin. Savings cost uses the current balance × APR; actual cost
                changes with rates, balances and compounding.{' '}
                <a
                  href="https://github.com/aave/interface/blob/main/src/utils/utils.ts#L143"
                  target="_blank"
                  rel="noreferrer"
                >
                  APY convention ↗
                </a>
              </p>
            </div>
          </>
        )}
      </section>

      <section id="live-quarters" className="section">
        <div className="table-topline">
          <div>
            <h2>Quarterly financial evidence</h2>
            <p className="live-subtitle">
              Fetched again on refresh, including updates to prior quarters and
              the current reporting period.
            </p>
          </div>
          <Status feed={data?.quarters} connectionError={Boolean(error)} />
        </div>
        {!data && !error ? (
          <Skeleton className="h-64 w-full" />
        ) : !quarters ? (
          <Empty
            message={
              error
                ? 'The site’s data connection is unavailable. Quarterly statements could not be checked.'
                : 'Quarterly statements could not be fetched. The dated audit remains available below; it has not been relabeled as current data.'
            }
          />
        ) : (
          <>
            <p className="live-source-line">
              <Source source={quarters.source} />
              <span>USD · fetched at the time above</span>
              <span>No per-row provider refresh timestamp is supplied.</span>
            </p>
            <Tabs defaultValue="revenue" className="comparison-tabs">
              <TabsList className="definition-tabs">
                <TabsTrigger value="revenue">
                  Revenue &amp; net status
                </TabsTrigger>
                <TabsTrigger value="costs">Reported cost lines</TabsTrigger>
              </TabsList>
              <TabsContent value="revenue">
                <QuarterRevenue rows={quarters.rows} />
              </TabsContent>
              <TabsContent value="costs">
                <QuarterCosts rows={quarters.rows} />
              </TabsContent>
            </Tabs>
            <p className="table-note">
              The current quarter is incomplete. “Unreported” preserves missing
              source entries; it never means zero. Borrow fees and facilitator
              yield are separate provider accounting lines whose non-overlap has
              not been independently audited. The statements are not reconciled
              to the broader GHO dashboard above.
            </p>
            <div className="caution">
              <strong>Live fetching does not close accounting gaps.</strong>
              <p>
                sGHO/Merit, liquidity and CEX lines record funding transfers and
                may include recoverable principal or overlapping downstream
                funding. stkGHO AAVE rewards are provider-valued accruals.
                Complete GHO Merit payouts, discount opportunity cost, realized
                GHO losses and GSM operations are not supplied by this feed. No
                automatic “first profitable quarter” is inferred from incomplete
                costs.
              </p>
            </div>
          </>
        )}
      </section>
      <p className="live-refresh-policy">
        Sources are checked every 2 minutes while this page is visible and when
        you return to it. A successful source response can be reused for up to
        60 seconds. After a fetch failure, cached values may remain for up to 24
        hours with a stale warning and their original timestamps. Financial
        reporting dates are checked separately from transport freshness.{' '}
        <a href="/api/live" target="_blank" rel="noreferrer">
          View the live JSON ↗
        </a>
      </p>
    </div>
  );
}
