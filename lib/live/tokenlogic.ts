import { fetchJson, finite, record } from './http';
import type { FinancialData, QuarterlyData, QuarterRow } from './types';

export const TOKENLOGIC_TABLE = 'https://aave.tokenlogic.xyz/api/data/table';
export const STATEMENTS_API =
  'https://aave.tokenlogic.xyz/api/data/financial-statements?granularity=quarterly';

export function rowsOf(value: unknown): Record<string, unknown>[] {
  const body = record(value);
  if (!Array.isArray(body.rows) || !body.rows.length)
    throw new Error('Source contains no rows');
  if (body.rows.length >= 5000 && 'columns' in body)
    throw new Error('Source table may be truncated');
  return body.rows.map(record);
}
function timestamp(value: unknown): string {
  const raw = typeof value === 'string' ? value : record(value).value;
  if (typeof raw !== 'string' || !Number.isFinite(Date.parse(raw)))
    throw new Error('Invalid source timestamp');
  return new Date(raw).toISOString();
}
function uniqueMetric(rows: Record<string, unknown>[], key: string) {
  const matches = rows.filter((row) => row.metric_key === key);
  if (matches.length !== 1)
    throw new Error('Required metric missing or duplicated');
  return {
    value: finite(matches[0].value),
    updatedAt: timestamp(matches[0].last_updated),
  };
}
export function normalizeFinancials(
  revenue: unknown,
  expenses: unknown,
): FinancialData {
  const revRows = rowsOf(revenue),
    expRows = rowsOf(expenses);
  const rev = uniqueMetric(revRows, 'annualised_revenue_90_day_average');
  const gsm = uniqueMetric(revRows, 'gsm_annualised_90_day_revenue');
  const net = uniqueMetric(revRows, 'annualised_90_day_net_revenue');
  const cost = uniqueMetric(expRows, 'annualised_expenses_90d');
  if (rev.value < 0 || gsm.value < 0 || gsm.value > rev.value || cost.value < 0)
    throw new Error('Invalid financial totals');
  if (
    Math.abs(rev.value - cost.value - net.value) >
    Math.max(1, rev.value * 0.001)
  )
    throw new Error('Reported financial metrics do not reconcile');
  const dates = [rev, gsm, net, cost].map((metric) =>
    Date.parse(metric.updatedAt),
  );
  if (Math.max(...dates) - Math.min(...dates) > 86400000)
    throw new Error('Financial sources have different reporting dates');
  return {
    source: {
      name: 'TokenLogic · GHO Financials',
      url: 'https://aave.tokenlogic.xyz/gho/financials',
      apiUrl: TOKENLOGIC_TABLE,
    },
    sourceUpdatedAt: new Date(Math.min(...dates)).toISOString(),
    windowLabel: 'Provider-reported 90-day annualized values',
    revenueAnnualizedUsd: rev.value,
    gsmRevenueAnnualizedUsd: gsm.value,
    expenseAnnualizedUsd: cost.value,
    reportedBalanceAnnualizedUsd: net.value,
    gsmExcludedBalanceAnnualizedUsd: rev.value - gsm.value - cost.value,
  };
}
export async function fetchFinancials(): Promise<FinancialData> {
  const table = (body: object) =>
    fetchJson(TOKENLOGIC_TABLE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  const [revenue, expenses] = await Promise.all([
    table({
      key: 'gho.revenue_overview_metrics',
      filters: {
        metric_key: [
          'annualised_revenue_90_day_average',
          'annualised_90_day_net_revenue',
          'gsm_annualised_90_day_revenue',
        ],
      },
    }),
    table({
      key: 'gho.expenses_metrics',
      filters: { metric_key: ['annualised_expenses_90d'] },
    }),
  ]);
  return normalizeFinancials(revenue, expenses);
}

const revenueFields: Record<
  string,
  keyof Pick<
    QuarterRow,
    | 'grossBorrowFeesUsd'
    | 'facilitatorYieldUsd'
    | 'gsmInterestUsd'
    | 'gsmSwapFeesUsd'
  >
> = {
  'Borrow Fees': 'grossBorrowFeesUsd',
  'Facilitator Deposit Yield': 'facilitatorYieldUsd',
  'GSM Interest': 'gsmInterestUsd',
  'GSM Swap Fees': 'gsmSwapFeesUsd',
};
export function normalizeQuarters(
  raw: unknown,
  now = new Date(),
): QuarterlyData {
  const rows = rowsOf(raw);
  const quarterly = new Map<string, QuarterRow>();
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.statement !== 'Income Statement') continue;
    const isRevenue =
      row.statement_section === 'Revenue' &&
      row.line_category === 'GHO Earnings';
    const isExpense =
      row.statement_section === 'Expenses' &&
      (row.line_category === 'GHO' ||
        (row.line_category === 'Staking' &&
          row.line_item === 'stkGHO Emissions') ||
        (row.line_category === 'Incentives' &&
          row.line_item === 'ALC GHO liquidity payment'));
    if (!isRevenue && !isExpense) continue;
    if (typeof row.line_item !== 'string')
      throw new Error('Missing statement line item');
    const start = timestamp(row.block_period).slice(0, 10);
    const date = new Date(`${start}T00:00:00Z`);
    if (
      date.getUTCDate() !== 1 ||
      date.getUTCMonth() % 3 !== 0 ||
      date > now ||
      start < '2023-07-01'
    )
      throw new Error('Invalid quarterly period');
    const key = `${start}:${String(row.statement_section)}:${String(row.line_category)}:${row.line_item}`;
    if (seen.has(key))
      throw new Error('Duplicate statement line would double-count a quarter');
    seen.add(key);
    const end = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 3, 1),
    );
    const entry = quarterly.get(start) ?? {
      periodStart: start,
      label: `Q${date.getUTCMonth() / 3 + 1} ${date.getUTCFullYear()}`,
      partial: now < end,
      sourceMissing: false,
      grossBorrowFeesUsd: null,
      facilitatorYieldUsd: null,
      gsmInterestUsd: null,
      gsmSwapFeesUsd: null,
      costs: {},
    };
    const amount = row.value_usd === null ? null : finite(row.value_usd);
    if (isRevenue && revenueFields[row.line_item])
      entry[revenueFields[row.line_item]] = amount;
    // Expense statements use negative amounts. Refunds/credits remain negative costs.
    if (isExpense)
      entry.costs[row.line_item] = amount === null ? null : -amount;
    quarterly.set(start, entry);
  }
  // Preserve an absent whole quarter rather than silently skipping the reporting gap.
  for (
    let start = new Date('2023-07-01T00:00:00Z');
    start <= now;
    start = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 3, 1),
    )
  ) {
    const key = start.toISOString().slice(0, 10);
    if (!quarterly.has(key))
      quarterly.set(key, {
        periodStart: key,
        label: `Q${start.getUTCMonth() / 3 + 1} ${start.getUTCFullYear()}`,
        partial:
          now <
          new Date(
            Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 3, 1),
          ),
        sourceMissing: true,
        grossBorrowFeesUsd: null,
        facilitatorYieldUsd: null,
        gsmInterestUsd: null,
        gsmSwapFeesUsd: null,
        costs: {},
      });
  }
  const result = [...quarterly.values()].sort((a, b) =>
    b.periodStart.localeCompare(a.periodStart),
  );
  if (!result.length || !result.some((q) => q.grossBorrowFeesUsd !== null))
    throw new Error('No GHO quarterly revenue was returned');
  return {
    source: {
      name: 'TokenLogic · Financial Statements',
      url: 'https://aave.tokenlogic.xyz/financials/statements',
      apiUrl: STATEMENTS_API,
    },
    rows: result,
  };
}
export async function fetchQuarters(): Promise<QuarterlyData> {
  return normalizeQuarters(await fetchJson(STATEMENTS_API));
}
