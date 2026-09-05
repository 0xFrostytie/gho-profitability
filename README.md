# GHO Economics

A sourced research site answering whether GHO is profitable for the Aave DAO under a specifically defined borrow-interest-only income test.

**Live dashboard with automatic refresh. The original research audit remains dated 2026-09-05.**

The page fetches public TokenLogic financials and quarterly statements, plus current Aave rates, on load, every two minutes while visible, when returning to the tab and on manual refresh. Each feed has its own observation time, source link and failure state. The complete net-profitability conclusion remains unverified because fetching current data does not supply the missing cost reconciliation.

## Finding

A complete net GHO income figure and first profitable quarter **cannot be established** from the reconciled primary evidence obtained.

[TokenLogic GHO Financials](https://aave.tokenlogic.xyz/gho/financials) displays approximately **+$2.22M annualized net** under a broader definition, with **$8.970M revenue** and **$6.748M expenses**, including **$3.220M GSM income** (all observed 2026-09-05). Removing GSM income yields an approximate **−$1.00M annualized sensitivity**, not a verified all-facilitator net loss. Published values are independently rounded.

Important limitations:

- The dashboard includes GSM backing yield, swap fees and incentive yield, outside the requested revenue numerator.
- Some reported cost centres recognize transfers to incentive managers or liquidity venues. Actual recipient expense, unspent funds, recoverable inventory and overlap are not fully reconciled.
- The complete GHO-only Merit distribution ledger, historical borrower-discount opportunity cost, realized GHO shortfalls and GSM operating costs remain unverified.
- The GHO dashboard and general DAO financial statements have unreconciled scope and accounting differences. Neither was silently used to correct the other.
- The requester-supplied circulation anchor differs from the dashboard's header scope. No dashboard margin is multiplied by global circulating supply.

The current-rates section fetches the official [Aave API](https://api.v3.aave.com/graphql). Integration on 2026-09-05 corrected an earlier unit error: **4.50% is the sGHO target APR**, equivalent to approximately **4.59% display APY** under [Aave’s monthly-compounding convention](https://github.com/aave/interface/blob/main/src/utils/utils.ts#L143). Against the observed Core borrow APY of approximately **4.08%**, that yields a **−0.51 percentage-point** yield comparison. It is not aggregate DAO profitability. The live display calculates the comparison again from each response.

The “Balance excluding GSM” diagnostic retains facilitator deposit yield; it does **not** isolate borrow-only income. The dated audit labels have been corrected accordingly.

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
node --test scripts/*.test.mjs
pnpm build
```

Lint checks project-authored code; the unmodified starter UI catalog and its generated mobile hook are excluded from lint because the scaffold has baseline lint errors. TypeScript checks include those dependencies. After the user requested an end-to-end check, the published page was verified in the browser for live source loading and manual refresh, alongside API, production Worker and automated lifecycle checks.

The hosting configuration is `.openai/hosting.json`. Sites owns production hosting. Credentials are supplied transiently during publishing and are never stored in this repository.

## Live data implementation

- `GET /api/live` runs server-side with three independent feeds: financial metrics, quarterly statements, and market rates. It returns source URLs, provider timestamps where supplied, fetch timestamps, status and nullable values.
- `lib/live/tokenlogic.ts` validates exact metric keys and statement categories. It rejects missing/duplicate metrics, inconsistent accounting totals and malformed numbers. Missing quarter entries remain unreported, including absent whole quarters. Previously reported quarters are re-fetched too.
- `lib/live/markets.ts` checks verified pool and token addresses on Ethereum and Monad. If the official API fails, verified public Ethereum RPC reads supply Core and sGHO at one pinned block; missing markets are explicitly excluded. It distinguishes APR, display APY, cap usage and utilization. GHO token units are not silently converted to USD.
- `lib/live/cache.ts` deduplicates concurrent loads per worker, reuses successful results for 60 seconds, and retains a last successful observation for at most 24 hours on a source outage. Cloudflare Cache API provides best-effort persistence, with in-memory storage in local development. No stale response receives a new fetch timestamp. Browser-retained responses expire too.
- The financial provider’s reporting timestamp is checked separately: over 36 hours old (or more than 5 minutes in the future) is flagged stale. Other APIs do not publish per-row reporting timestamps; the page explicitly labels their fetch time as the observation time.
- `lib/live/polling.ts` pauses polling in background tabs and prevents overlapping requests. Refresh failures show errors and unavailable states; the static audit is never substituted as live data.
- Public anonymous upstream requests use fixed endpoints, timeouts and response validation. No API keys or secrets are needed. The public route accepts no proxy URL or credential input.

See `research/live-sources.md` for the request contracts and their limitations. These third-party public API contracts can change; incompatible payloads produce stale/unavailable states rather than fabricated results. Data is fetched on demand, not by a scheduled background job.

## Updating the analysis

Read the existing source definitions before replacing values. Preserve separate observation, publication and reporting dates. Reconcile transfers with paid-out rewards and remaining manager balances, exclude recoverable inventory, avoid duplicate funding/settlement costs and verify facilitator coverage. Obtain the native discount history and reserve loss ledger. Only then calculate a complete net and assign a first profitable period.

Do not annualize quarterly cash receipts as if they were accrued earnings, treat a voted budget as spend, treat cap utilization as supplier utilization, or substitute a proposed rate for an observed rate.
