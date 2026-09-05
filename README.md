# GHO Economics

A sourced research site answering whether GHO is profitable for the Aave DAO under a specifically defined borrow-interest-only income test.

**Observation date: 2026-09-05. This is a fixed research snapshot, not an automatically updated feed.**

## Finding

A complete net GHO income figure and first profitable quarter **cannot be established** from the reconciled primary evidence obtained.

[TokenLogic GHO Financials](https://aave.tokenlogic.xyz/gho/financials) displays approximately **+$2.22M annualized net** under a broader definition, with **$8.970M revenue** and **$6.748M expenses**, including **$3.220M GSM income** (all observed 2026-09-05). Removing GSM income yields an approximate **−$1.00M annualized sensitivity**, not a verified all-facilitator net loss. Published values are independently rounded.

Important limitations:

- The dashboard includes GSM backing yield, swap fees and incentive yield, outside the requested revenue numerator.
- Some reported cost centres recognize transfers to incentive managers or liquidity venues. Actual recipient expense, unspent funds, recoverable inventory and overlap are not fully reconciled.
- The complete GHO-only Merit distribution ledger, historical borrower-discount opportunity cost, realized GHO shortfalls and GSM operating costs remain unverified.
- The GHO dashboard and general DAO financial statements have unreconciled scope and accounting differences. Neither was silently used to correct the other.
- The requester-supplied circulation anchor differs from the dashboard's header scope. No dashboard margin is multiplied by global circulating supply.

The [official Core reserve page](https://app.aave.com/reserve-overview/?underlyingAsset=0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f&marketName=proto_mainnet_v3) displayed **4.08% borrow APY** and **74.37% borrow-cap usage**; the [Aave markets savings banner](https://app.aave.com/markets/) displayed **4.50% savings APY**, on 2026-09-05. The derived **−0.42 percentage-point** matched-unit spread is not aggregate DAO profitability.

## Evidence

- `research/quarterly.json`: primary-provider quarterly statements, all displayed values, preserved nulls and accounting caveats. Each series shares an explicit source URL and observation date. A null means unreported, never assumed zero.
- `research/dashboard-evidence.md`: current rates, P&L cards, expense methodology, Dune edit timestamps, Chaos access limitations and source discrepancies.
- `research/governance-evidence.md`: budgets versus spend, discount removal, break-even claims, exact Snapshot links and identified operational items.
- `lib/research.ts`: the source register used by the site.

The requested definition is gross GHO borrow interest less GHO incentives, discount opportunity cost, realized shortfalls and GSM operating costs. No source found provides a complete reconciled quarterly series matching all those terms. The site displays missing net values explicitly, instead of interpolating or treating missing expenses as zero.

## Development

React, TypeScript, Vinext, Tailwind and the Sites starter's existing accessible UI primitives. No external API keys, wallet connection, analytics tracking, database or automatic financial actions.

```sh
pnpm install
pnpm dev
```

Validation:

```sh
pnpm exec tsc --noEmit
pnpm lint
node --test scripts/research.test.mjs
pnpm build
```

Lint checks project-authored code; the unmodified starter UI catalog and its generated mobile hook are excluded from lint because the scaffold has baseline lint errors. TypeScript checks include those dependencies. No browser visual QA was requested or performed.

The hosting configuration is `.openai/hosting.json`. Sites owns production hosting. Credentials are supplied transiently during publishing and are never stored in this repository.

## Updating the analysis

Read the existing source definitions before replacing values. Preserve separate observation, publication and reporting dates. Reconcile transfers with paid-out rewards and remaining manager balances, exclude recoverable inventory, avoid duplicate funding/settlement costs and verify facilitator coverage. Obtain the native discount history and reserve loss ledger. Only then calculate a complete net and assign a first profitable period.

Do not annualize quarterly cash receipts as if they were accrued earnings, treat a voted budget as spend, treat cap utilization as supplier utilization, or substitute a proposed rate for an observed rate.
