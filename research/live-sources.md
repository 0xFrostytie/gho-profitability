# Public live data contracts

Verified 2026-09-05. These are public anonymous reads used by the provider applications. No sign-in, private export or API key is required. API transport observation times are distinct from financial reporting dates. These contracts may change; schema failures are shown as unavailable/stale.

## TokenLogic financial headline

Source: https://aave.tokenlogic.xyz/gho/financials

POST https://aave.tokenlogic.xyz/api/data/table with JSON:

```json
{
  "key": "gho.revenue_overview_metrics",
  "filters": {
    "metric_key": [
      "annualised_revenue_90_day_average",
      "annualised_90_day_net_revenue",
      "gsm_annualised_90_day_revenue"
    ]
  }
}
```

```json
{
  "key": "gho.expenses_metrics",
  "filters": { "metric_key": ["annualised_expenses_90d"] }
}
```

Read rows by `metric_key`, numeric `value`, `last_updated.value`. Provider values observed 2026-09-05: revenue 8,969,872.653400987 USD/year; GSM 3,222,619.2230228963; expenses 6,748,381.752399203; reported balance 2,221,490.901001785. Oldest component timestamp 2026-09-05T00:15:17.144924Z. Derived balance excluding GSM = −1,001,128.3220211128 USD/year. It retains facilitator yield and is not borrow-only income. All are provider-labelled 90-day annualized values, not realized annual figures; exact period boundaries and accounting scope remain unreconciled. Validation checks the reported arithmetic and component timestamps.

## Quarterly statements

Source: https://aave.tokenlogic.xyz/financials/statements

GET https://aave.tokenlogic.xyz/api/data/financial-statements?granularity=quarterly

Read `rows`, with `block_period.value`, `statement`, `statement_section`, `line_category`, `line_item`, `value_usd`. Only Income Statement rows are selected. Revenue/GHO Earnings provides Borrow Fees, Facilitator Deposit Yield, GSM Interest and GSM Swap Fees separately. No claim of independently audited non-overlap is made.

Costs include Expenses/GHO (all named items), Staking/stkGHO Emissions and Incentives/ALC GHO liquidity payment. Expenses use negative source signs, reversed for cost display; positive credits remain negative costs. General Insurance/Aave Umbrella is not allocated wholesale to GHO. Transfer lines do not prove ultimate recipient expenditure. No total actual GHO Merit spend, discount opportunity cost, complete realized loss ledger or GSM-only operating cost is reconstructed from absent data.

Null entries and missing quarters stay unreported. No per-row refreshed-at field is available. Current-quarter status is calculated against UTC calendar boundaries, not a claim that prior periods were audited. The complete endpoint was fetched successfully; it is not the separate 5,000-row-capped generic table endpoint.

## Official Aave rates

Source: https://app.aave.com/markets/

POST https://api.v3.aave.com/graphql. The checked query is `MARKET_QUERY` in `lib/live/markets.ts`: markets on chains 1 and 143, BORROW reserves, token identity and decimals, borrow APY/total/cap/reserve factor/utilization, plus Ethereum sghoVault totalAssets/targetRate/paused. Four verified market and two token addresses are explicitly selected in code. API values are decimal fractions and whole token amounts. No block or per-row reporting timestamp is returned.

Savings `targetRate.value` is APR. Display APY follows Aave’s monthly conversion: https://github.com/aave/interface/blob/main/src/utils/utils.ts#L143 . Configured 4.50% APR yields approximately 4.5939825% display APY; actual realization depends on updates and rates. Fixed-balance annual cost = current GHO claims × APR, expressed in GHO, not USD. Core APY − savings display APY is a yield comparison, not total DAO margin. API utilization and debt/borrow-cap usage have different denominators.

## Ethereum fallback

Fixed RPC endpoints: https://ethereum-rpc.publicnode.com and https://eth.drpc.org . Requests pin all calls to the same latest block and reject stale block timestamps. Batch responses are matched by ID, independent of ordering.

Core data provider: https://etherscan.io/address/0x0a16f2fcc0d44fae41cc54e079281d84a363becd

sGHO: https://etherscan.io/address/0xe1753f2e00940cc31213dd92013cf019dfe4ca1d

Read `getReserveData(GHO)` (debt and borrow APR), `getReserveCaps(GHO)`, `getReserveConfigurationData(GHO)` (decimals and reserve factor), sGHO `targetRate()` and `totalAssets()`. Debt uses 18 decimals; borrow APR uses ray units; target savings rate and reserve factor use basis points; cap is whole GHO. Core borrow APY uses Aave’s per-second compounding conversion. Fallback explicitly covers only Core and sGHO, with utilization and savings pause status unknown. It does not infer global circulating supply from Ethereum totalSupply or bridge escrow.
