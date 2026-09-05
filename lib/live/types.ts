import type { Feed } from './cache';

export type SourceReference = { name: string; url: string; apiUrl: string };
export type FinancialData = {
  source: SourceReference;
  sourceUpdatedAt: string;
  windowLabel: string;
  revenueAnnualizedUsd: number;
  gsmRevenueAnnualizedUsd: number;
  expenseAnnualizedUsd: number;
  reportedBalanceAnnualizedUsd: number;
  gsmExcludedBalanceAnnualizedUsd: number;
};
export type QuarterRow = {
  periodStart: string;
  label: string;
  partial: boolean;
  sourceMissing: boolean;
  grossBorrowFeesUsd: number | null;
  facilitatorYieldUsd: number | null;
  gsmInterestUsd: number | null;
  gsmSwapFeesUsd: number | null;
  costs: Record<string, number | null>;
};
export type QuarterlyData = { source: SourceReference; rows: QuarterRow[] };
export type MarketRow = {
  name: string;
  chainId: number;
  address: string;
  borrowApy: number;
  borrowedGho: number;
  borrowCapGho: number;
  capUsage: number | null;
  reserveFactor: number;
  utilization: number | null;
};
export type MarketData = {
  source: SourceReference;
  coverage: 'four-markets' | 'ethereum-core-only';
  block: { number: string; timestamp: string } | null;
  markets: MarketRow[];
  savingsApr: number;
  savingsDisplayApy: number;
  savingsGho: number;
  savingsAnnualCostGho: number;
  savingsPaused: boolean | null;
  matchedApySpread: number;
};
export type LiveData = {
  version: 1;
  requestedAt: string;
  refreshAfterSeconds: number;
  financials: Feed<FinancialData>;
  quarters: Feed<QuarterlyData>;
  markets: Feed<MarketData>;
};
