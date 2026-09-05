export const observed = '2026-09-05';
export const sources: Record<
  string,
  {
    title: string;
    url: string;
    date: string;
    note: string;
  }
> = {
  savingsConvention: {
    title: 'Aave interface · savings APR to APY',
    url: 'https://github.com/aave/interface/blob/main/src/utils/utils.ts#L143',
    date: 'Observed 5 September 2026 · live integration correction',
    note: 'Savings target rate is APR. The official interface displays APY using monthly compounding: (1 + APR / 12)^12 − 1. At 4.50% APR this is approximately 4.59% APY.',
  },

  financials: {
    title: 'TokenLogic · GHO Financials',
    url: 'https://aave.tokenlogic.xyz/gho/financials',
    date: 'Live view, observed 2026-09-05',
    note: 'Public rounded P&L cards and cost centres. Header scope and annualization methodology require reconciliation. Historical download requires sign-in.',
  },
  revenue: {
    title: 'TokenLogic · Revenue breakdown',
    url: 'https://aave.tokenlogic.xyz/financials/revenue',
    date: 'Live view, observed 2026-09-05',
    note: 'Expanded quarterly GHO Interest row and separate facilitator income. Values transcribed at displayed precision.',
  },
  expenses: {
    title: 'TokenLogic · Expense breakdown',
    url: 'https://aave.tokenlogic.xyz/financials/expenses',
    date: 'Live view, observed 2026-09-05',
    note: 'Cost centres include funding transfers. Transfers are not necessarily recipient spending or irreversible costs.',
  },
  statements: {
    title: 'TokenLogic · Statements and methodology',
    url: 'https://aave.tokenlogic.xyz/financials/statements',
    date: 'Live methodology, observed 2026-09-05',
    note: 'GHO borrow fees accrue hourly. Merit is recognized when the DAO transfers funds to ACI; liquidity and CEX cost lines also use transfers.',
  },
  markets: {
    title: 'TokenLogic · GHO Markets',
    url: 'https://aave.tokenlogic.xyz/gho/markets',
    date: 'Live view, observed 2026-09-05',
    note: 'Per-market loans, rates and utilization. TokenLogic’s Core denominator differs from the official borrow cap.',
  },
  aave: {
    title: 'Aave · Ethereum Core GHO reserve',
    url: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f&marketName=proto_mainnet_v3',
    date: 'Live view, observed 2026-09-05',
    note: 'Official Core borrow APY, debt, cap usage and reserve factor. Mint-cap usage is not deposit-market utilization.',
  },
  savings: {
    title: 'Aave · Markets / GHO Savings',
    url: 'https://app.aave.com/markets/',
    date: 'Live view, observed 2026-09-05',
    note: 'Official savings banner reports deposits; configured target rate is APR, converted to display APY using the interface convention. Different sampling times can produce differing dashboard balances.',
  },
  gho: {
    title: 'GHO · Official website',
    url: 'https://gho.xyz/',
    date: 'Checked 2026-09-05',
    note: 'Product information; no complete historical net GHO P&L established here.',
  },
  historicalMethod: {
    title: 'TokenLogic · GHO revenue methodology',
    url: 'https://governance.aave.com/t/gho-analytics-tokenlogic/14067/12',
    date: 'Published 2023-09-10 · observed 2026-09-05',
    note: 'Explains accrued versus realized interest; historical unrealized debt can overstate interest before borrower discounts settle.',
  },
  discount: {
    title: 'BGD · Aave v3.4 discount removal',
    url: 'https://governance.aave.com/t/arfc-bgd-aave-v3-4/21572/23',
    date: 'Published 2025-07-02 · observed 2026-09-05',
    note: 'Upgrade scheduled after the timelock removes the native GHO discount. Exact execution time was not independently verified.',
  },
  discountVote: {
    title: 'Aave · v3.4 activation (AIP 334)',
    url: 'https://vote.onaave.com/proposal/?proposalId=334',
    date: 'July 2025 activation · observed 2026-09-05',
    note: 'Linked implementation for the discount removal; do not infer an exact hour of activation from the forum.',
  },
  forecast: {
    title: 'ACI · AAVEnomics update',
    url: 'https://governance.aave.com/t/temp-check-aavenomics-update/18379/1',
    date: 'Published 2024-07-25 · observed 2026-09-05',
    note: 'Forecasts break-even at a supply threshold. A forecast is not an achieved accounting period.',
  },
  meritClaim: {
    title: 'ACI · Aavenomics implementation, part one',
    url: 'https://governance.aave.com/t/arfc-aavenomics-implementation-part-one/21248',
    date: 'Published 2025-03-04 · observed 2026-09-05',
    note: 'Merit self-sufficiency claim uses standard-rate forecast interest, while acknowledging broader Merit/ALC deficits.',
  },
  alc: {
    title: 'TokenLogic · ALC funding, phase VII',
    url: 'https://governance.aave.com/t/arfc-aave-liquidity-committee-funding-phase-vii/23143',
    date: 'Published 2025-09-17 · observed 2026-09-05',
    note: 'Describes GHO as approaching incentive break-even. Funding allowance is not quarterly spend.',
  },
  funding: {
    title: 'TokenLogic · Aave DAO Funding Insights',
    url: 'https://governance.aave.com/t/aave-dao-funding-insights/24192',
    date: 'Published 2026-02-28 · observed 2026-09-05',
    note: 'Forward budgets, treasury runway and GHO incentive economics; not a standalone quarterly GHO net-income series.',
  },
  launch: {
    title: 'TokenLogic / ACI · sGHO launch configuration',
    url: 'https://governance.aave.com/t/arfc-sgho-launch-configuration/24346',
    date: 'Published 2026-03-25 · observed 2026-09-05',
    note: 'Native savings replaces fixed weekly Merit funding with deposit-dependent rewards. Avoid counting both full run rates.',
  },
  may: {
    title: 'Aave Labs · May development update',
    url: 'https://governance.aave.com/t/al-development-update-may-2026/25013',
    date: 'May 2026 reporting period · observed 2026-09-05',
    note: 'Confirms the native GHO savings launch during May.',
  },
  august: {
    title: 'TokenLogic · August GHO rate update',
    url: 'https://governance.aave.com/t/gho-stewards-august-2026-gho-borrow-rate-and-aave-savings-rate-update/25534',
    date: 'Published 2026-08-27 · observed 2026-09-05',
    note: 'Forward staged changes, not all verified executed. Contains conflicting savings/borrow comparison and timing language.',
  },
  transparency: {
    title: 'ACI · Full transparency report',
    url: 'https://governance.aave.com/t/aci-full-transparency-report/24085',
    date: 'February 2026; figures as of 2026-02-13 · observed 2026-09-05',
    note: 'GHO-attributed protocol revenue includes multiple fee types; not automatically pure GHO borrow interest or net income.',
  },
  deficits: {
    title: 'Chaos Labs · Revenue-indexed deficit offsets',
    url: 'https://governance.aave.com/t/arfc-revenue-indexed-deficit-offsets-for-umbrella/24000/1',
    date: 'Published 2026-02-04 · observed 2026-09-05',
    note: 'Outstanding realized deficits listed for other reserves. No GHO entry is not proof of zero GHO loss in all periods.',
  },
  pause: {
    title: 'Aave Labs · GHO pause incident',
    url: 'https://governance.aave.com/t/temporarily-pausing-gho-integration-in-aave/14626/4',
    date: 'Published 2023-09-01 · observed 2026-09-05',
    note: 'August GHO incident reported no lost funds or bad debt. Event-specific evidence only.',
  },
  auditApril: {
    title: 'TokenLogic · April 2026 funding update',
    url: 'https://governance.aave.com/t/direct-to-aip-april-2026-funding-update/24447',
    date: 'Published 2026-04-15 · observed 2026-09-05',
    note: 'GhoRouter audit reimbursement and incentive allowances. Incurrence date and GSM-only allocation not established.',
  },
  auditJune: {
    title: 'TokenLogic · May/June funding update',
    url: 'https://governance.aave.com/t/direct-to-aip-may-june-2026-funding-update/25000',
    date: 'Published 2026-06-01 · observed 2026-09-05',
    note: 'Final GhoRouter audit instalment. Do not add again if already captured in dashboard expenses.',
  },
  meritVote: {
    title: 'Snapshot · Initial Merit proposal',
    url: 'https://snapshot.org/#/aave.eth/proposal/0xc80da83fadfe4f8a4c56e1643895cb7e9b1af1d9dcd374f1b41ded5c95b42f68',
    date: '2024 proposal · link checked 2026-09-05',
    note: 'Exact link verified from governance forum. Independent vote-result extraction unavailable.',
  },
  aavenomicsVote: {
    title: 'Snapshot · AAVEnomics temperature check',
    url: 'https://snapshot.org/#/aave.eth/proposal/0x7f4941aff652cf2a41f47bc58220a952e4894fdc16e27a975045faa9c458da19',
    date: '2024 proposal · link checked 2026-09-05',
    note: 'Forum follow-up says passed. Vote approval is not a verification of realized break-even.',
  },
  partOneVote: {
    title: 'Snapshot · Aavenomics part one',
    url: 'https://snapshot.box/#/s:aave.eth/proposal/0xf0591fe8e54900da9929fe25c466c2b4a0fac6e8f7a3a000087797363847fb65',
    date: 'March 2025 proposal · link checked 2026-09-05',
    note: 'Forum follow-up reports passage; projections remain projections.',
  },
  community: {
    title: 'Community discussion · GHO V2 / Sky',
    url: 'https://governance.aave.com/t/gho-v2-partnering-with-sky-protocol-and-becoming-profitable-potential-70m-annual-profit/25156',
    date: 'Published 2026-06-16 · observed 2026-09-05',
    note: 'Community speculation, not an official DAO financial statement or verified net-profit claim.',
  },
  duneAave: {
    title: 'Dune · Aave Labs / GHO',
    url: 'https://dune.com/aavelabs/gho',
    date: 'Dashboard edited 2024-05-25 18:01:59 UTC · observed 2026-09-05',
    note: 'Supply, holders and facilitator analytics, not full P&L. Dashboard edit time is not query refresh time.',
  },
  duneTokenlogic: {
    title: 'Dune · TokenLogic / Avalanche GHO',
    url: 'https://dune.com/tokenlogic/aave-avax-gho',
    date: 'Dashboard edited 2025-08-05 08:19:48 UTC · observed 2026-09-05',
    note: 'Supply, debt and mint/burn analytics. Query cards required Run; current results were not available anonymously.',
  },
  duneSteakhouse: {
    title: 'Dune · Steakhouse / Stablecoin locations',
    url: 'https://dune.com/steakhouse/stablecoins',
    date: 'Dashboard edited 2024-08-05 15:26:48 UTC · observed 2026-09-05',
    note: 'Broader stablecoin usage dashboard; no complete GHO P&L was verified.',
  },
  chaos: {
    title: 'Chaos Labs · Aave GHO risk dashboard',
    url: 'https://community.chaoslabs.xyz/aave/risk/GHO/overview',
    date: 'Attempted 2026-09-05 · refresh time unverified',
    note: 'Public dashboard did not resolve in the research browser. Current risk metrics and update date could not be verified.',
  },
  chaosLaunch: {
    title: 'Chaos Labs · GHO monitoring dashboard launch',
    url: 'https://chaoslabs.xyz/posts/chaos-labs-aave-gho-risk-monitoring-dashboard',
    date: 'Published 2023-03-09 · observed 2026-09-05',
    note: 'Historical monitoring explainer; not current data or a complete GHO P&L.',
  },
};
