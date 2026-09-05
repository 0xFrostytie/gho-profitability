import { ArrowDownRight, ArrowUpRight, ExternalLink } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { sources } from '@/lib/research';
import data from '@/research/quarterly.json';

const sourceNumbers = Object.fromEntries(
  Object.keys(sources).map((key, i) => [key, i + 1]),
);
function Cite({ id }: { id: string }) {
  const s = sources[id];
  return (
    <a
      className="citation"
      href={s.url}
      target="_blank"
      rel="noreferrer"
      title={`${s.title} · ${s.date}`}
    >
      [{sourceNumbers[id]}]
      <span className="sr-only">
        {' '}
        {s.title}; {s.date}
      </span>
    </a>
  );
}
function SourceLink({ id, label }: { id: string; label?: string }) {
  return (
    <a
      className="source-link"
      href={sources[id].url}
      target="_blank"
      rel="noreferrer"
    >
      {label || sources[id].title} <ArrowUpRight size={14} />
    </a>
  );
}
function SectionHead({
  n,
  title,
  sub,
}: {
  n: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="section-heading">
      <span className="section-no">{n} /</span>
      <div>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
    </div>
  );
}
const money = (v: number | null) =>
  v === null
    ? '—'
    : v >= 1e6
      ? `$${(v / 1e6).toFixed(2)}M`
      : `$${(v / 1e3).toFixed(2)}K`;
const period = (i: number) =>
  data.periodOrder[i]
    .replace(/(\d{4})Q(\d)(_partial)?/, 'Q$2 $1$3')
    .replace('_partial', ' · partial');
const recent = Array.from({ length: 9 }, (_, i) => i);
const earlier = [9, 10, 11, 12];
function RevenueTable({ indices }: { indices: number[] }) {
  return (
    <Table className="research-table revenue-table">
      <TableHeader>
        <TableRow>
          <TableHead>Quarter</TableHead>
          <TableHead>
            Gross borrow fees <Cite id="statements" />
          </TableHead>
          <TableHead>
            Facilitator yield <Cite id="statements" />
          </TableHead>
          <TableHead>
            GSM yield / swap fees
            <br />
            <span className="column-note">
              Excluded from the requested test
            </span>
          </TableHead>
          <TableHead>
            Net GHO income
            <br />
            <span className="column-note">All requested costs deducted</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {indices.map((i) => (
          <TableRow key={i} className={i === 0 ? 'partial-row' : ''}>
            <TableCell className="period-cell">
              {period(i)} <Cite id="statements" />
            </TableCell>
            <TableCell className="number">
              {money(data.reported.ghoBorrowFees[i])}
            </TableCell>
            <TableCell className="number">
              {money(data.reported.facilitatorDepositYield[i])}
            </TableCell>
            <TableCell className="number muted">
              {money(data.reported.gsmInterest[i])} /{' '}
              {money(data.reported.gsmSwapFees[i])}
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
function CostsTable({ indices }: { indices: number[] }) {
  return (
    <Table className="research-table costs-table">
      <TableHeader>
        <TableRow>
          <TableHead>Quarter</TableHead>
          <TableHead>
            Total actual
            <br />
            GHO Merit spend
          </TableHead>
          <TableHead>
            sGHO / Merit
            <br />
            funding transfers
          </TableHead>
          <TableHead>
            GHO liquidity
            <br />
            transfers
          </TableHead>
          <TableHead>
            CEX / market
            <br />
            maker transfers
          </TableHead>
          <TableHead>
            stkGHO AAVE
            <br />
            reward accrual
          </TableHead>
          <TableHead>
            Borrow discount
            <br />
            opportunity cost
          </TableHead>
          <TableHead>
            Bad debt /<br />
            GSM operations
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {indices.map((i) => (
          <TableRow key={i}>
            <TableCell className="period-cell">
              {period(i)} <Cite id="statements" />
            </TableCell>
            <TableCell>
              <span className="unknown">Unverified</span>
            </TableCell>
            <TableCell className="number">
              {money(data.reported.sGhoTransfers[i])}
            </TableCell>
            <TableCell className="number">
              {money(data.reported.ghoLiquidityTransfers[i])}
            </TableCell>
            <TableCell className="number">
              {money(data.reported.ghoCexTransfers[i])}
            </TableCell>
            <TableCell className="number">
              {money(data.reported.stkGhoAaveEmissions[i])}
            </TableCell>
            <TableCell>
              <span className="muted">
                {i <= 3 ? '$0 native*' : 'Unverified'}
              </span>
              <Cite id="discount" />
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

export default function Home() {
  return (
    <main id="top">
      <header className="site-header">
        <a href="#top" className="wordmark">
          GHO<span> / ECONOMICS</span>
        </a>
        <nav aria-label="Report sections">
          <a href="#quarters">Quarterly data</a>
          <a href="#spread">Current economics</a>
          <a href="#sources">Sources</a>
          <a
            href="https://github.com/0xFrostytie/gho-profitability"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <ExternalLink size={14} />
          </a>
        </nav>
      </header>
      <div className="report-shell">
        <div className="eyebrow">
          <span className="signal" /> INDEPENDENT RESEARCH{' '}
          <span className="date">
            OBSERVED 05 SEP 2026 · FIXED RESEARCH SNAPSHOT
          </span>
        </div>
        <section id="verdict" className="intro">
          <div>
            <h1>
              Does GHO
              <br />
              pay for itself?
            </h1>
            <p className="intro-copy">
              GHO earns interest. Whether it earns a profit depends on the
              incentives it funds and the costs included in the accounts.
            </p>
            <a className="text-link" href="#quarters">
              Explore the quarterly evidence <ArrowDownRight size={18} />
            </a>
          </div>
          <div className="finding">
            <span className="label">THE FINDING / QUALIFIED</span>
            <h2>
              Net profitability is
              <br />
              not established under
              <br />
              the requested definition.
            </h2>
            <p>
              TokenLogic reports a positive recent GHO business balance that
              includes GSM income. A borrow-interest-only reconstruction turns
              negative for that reported scope. Missing cost reconciliation and
              coverage differences prevent a definitive DAO-wide net figure or a
              verified first profitable quarter. <Cite id="financials" />
              <Cite id="statements" />
            </p>
          </div>
        </section>
        <div className="metrics">
          <div className="metric">
            <span>Published broader balance</span>
            <strong className="positive">
              +$2.22M<span>/yr</span>
            </strong>
            <p>
              Dashboard annualized net; includes GSM income.{' '}
              <Cite id="financials" />
            </p>
          </div>
          <div className="metric">
            <span>Borrow-only diagnostic</span>
            <strong className="negative">
              −$1.00M<span>/yr</span>
            </strong>
            <p>
              Approximate, same reported scope, GSM income removed. Not a full
              net P&amp;L. <Cite id="financials" />
            </p>
          </div>
          <div className="metric">
            <span>First profitable quarter</span>
            <strong className="unresolved">Unverified</strong>
            <p>
              No quarter meets the complete revenue-and-cost test in the
              evidence obtained.
            </p>
          </div>
        </div>
        <p className="micro-note">
          Annualized figures above are the dashboard’s trailing-window
          presentation, not annual realized profit. All observations in this
          report were made on 5 September 2026. <Cite id="financials" />
        </p>

        <section id="definition" className="section">
          <SectionHead
            n="01"
            title="Define the profit before measuring it"
            sub="Gross GHO borrow interest is revenue before GHO incentives. It is not net income."
          />
          <div className="formula-panel">
            <span>REQUESTED NET GHO INCOME</span>
            <h3>
              Gross borrow interest <b>−</b> GHO incentives <b>−</b> discount
              subsidy
              <br />
              <b>−</b> realized shortfalls <b>−</b> GSM operating costs
            </h3>
            <p>
              Includes GHO-related Merit, liquidity incentives and savings
              costs. Excludes GSM backing yield and swap-fee revenue from the
              numerator, as required by this research question.
            </p>
          </div>
          <div className="two-col prose-grid">
            <div>
              <h3>Follow the DAO’s interest capture</h3>
              <p>
                The supplied DefiLlama methodology anchor treats all native GHO
                borrower interest as DAO revenue; that says nothing about
                incentive deductions. TokenLogic separates “Borrow Fees (GHO)”
                from interest on facilitator-minted GHO deposited in lending
                markets. Both are shown here so the DAO’s supply-side capture is
                not lost. <Cite id="statements" />
              </p>
              <p>
                GSM backing earns interest on other assets and GSM swaps earn
                fees. Those belong to a broader stablecoin business P&amp;L,
                outside the specified revenue definition.
              </p>
            </div>
            <div>
              <h3>Keep discounts and rewards distinct</h3>
              <p>
                Interest actually earned already reflects the rate borrowers
                paid. The requested additional deduction for foregone
                standard-rate interest is an economic opportunity-cost
                adjustment. It must not be deducted twice while converting
                hypothetical standard-rate revenue to actual interest.{' '}
                <Cite id="historicalMethod" />
              </p>
              <p>
                GHO-specific Umbrella or Safety Module rewards are incentive
                costs, not borrower discounts. Protocol-wide insurance costs are
                not all attributable to GHO.
              </p>
            </div>
          </div>
        </section>

        <section id="reconstruction" className="section">
          <SectionHead
            n="02"
            title="One dashboard. Two accounting perimeters."
            sub="The best recent partial reconstruction — annualized USD, observed 5 September 2026."
          />
          <Tabs defaultValue="strict" className="comparison-tabs">
            <TabsList className="definition-tabs">
              <TabsTrigger value="strict">
                Requested borrow-only test
              </TabsTrigger>
              <TabsTrigger value="broad">
                Published GHO business P&amp;L
              </TabsTrigger>
            </TabsList>
            <TabsContent value="strict">
              <div className="reconstruction">
                <div className="ledger">
                  <div>
                    <span>Reported total GHO revenue</span>
                    <b>
                      $8.970M <Cite id="financials" />
                    </b>
                  </div>
                  <div>
                    <span>Remove GSM income</span>
                    <b className="negative">
                      −$3.220M <Cite id="financials" />
                    </b>
                  </div>
                  <div className="subtotal">
                    <span>Remaining reported revenue</span>
                    <b>≈$5.750M</b>
                  </div>
                  <div>
                    <span>Reported GHO expenses</span>
                    <b className="negative">
                      −$6.748M <Cite id="financials" />
                    </b>
                  </div>
                  <div className="ledger-result">
                    <span>Partial borrow-only balance</span>
                    <b className="negative">≈−$0.998M</b>
                  </div>
                </div>
                <div className="ledger-explanation">
                  <span className="badge derived">DERIVED · PARTIAL</span>
                  <h3>The excluded income changes the sign.</h3>
                  <p>
                    Subtracting the GSM revenue component (backing yield, swap
                    fees and incentive yield) eliminates the dashboard’s
                    reported positive balance. Any residual non-borrow revenue
                    would need removal too.
                  </p>
                  <p>
                    This is a diagnostic of the provider’s reported scope. It is
                    not a verified global loss: cost recognition, coverage and
                    additional adjustments remain unresolved.{' '}
                    <Cite id="financials" />
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="broad">
              <div className="reconstruction">
                <div className="ledger">
                  <div>
                    <span>Core GHO interest</span>
                    <b>≈$3.750M</b>
                  </div>
                  <div>
                    <span>Prime interest</span>
                    <b>≈$0.923M</b>
                  </div>
                  <div>
                    <span>Horizon interest</span>
                    <b>≈$1.080M</b>
                  </div>
                  <div>
                    <span>GSM income</span>
                    <b>≈$3.220M</b>
                  </div>
                  <div>
                    <span>Reported GHO expenses</span>
                    <b className="negative">−$6.748M</b>
                  </div>
                  <div className="ledger-result">
                    <span>Dashboard net balance</span>
                    <b className="positive">+$2.221M</b>
                  </div>
                </div>
                <div className="ledger-explanation">
                  <span className="badge reported">
                    REPORTED · BROADER SCOPE
                  </span>
                  <h3>A positive business balance, with qualifications.</h3>
                  <p>
                    Component values and the net card are independently rounded.
                    Their arithmetic need not sum exactly. The dashboard also
                    shows cumulative revenue of $24.92M and expenses of $25.16M,
                    a derived cumulative balance of approximately −$0.24M.{' '}
                    <Cite id="financials" />
                  </p>
                  <p>
                    Its expense definition combines program transfers with
                    accrued staker rewards. It does not establish complete
                    actual incentive consumption, historical discount
                    opportunity cost, or a realized-loss and GSM-operations
                    reconciliation.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="caution">
            <strong>Three limits on this calculation</strong>
            <p>
              The dashboard’s supply header shows $251.4M, versus the
              requester’s confirmed $698M circulating-supply anchor. Their
              scopes are not reconciled. Its annualization text refers to both a
              trailing 90-day window and the most recent month. Its GHO chart
              and general financial statements are also not fully reconciled. We
              therefore do not scale these margins to total circulating supply
              or read a break-even date from chart pixels.{' '}
              <Cite id="financials" />
              <Cite id="statements" />
            </p>
          </div>
        </section>

        <section id="quarters" className="section">
          <SectionHead
            n="03"
            title="The quarterly evidence"
            sub="Eight completed quarters, plus the current partial quarter. USD as displayed by TokenLogic; observed 5 September 2026."
          />
          <div className="table-topline">
            <h3>Revenue and the requested net-income series</h3>
            <span className="badge reported">PRIMARY SOURCE · ROUNDED</span>
          </div>
          <RevenueTable indices={recent} />
          <p className="table-note">
            Revenue is gross of GHO incentives. Facilitator yield is shown
            separately; the accounting implementation and non-overlap have not
            been independently audited. GSM revenue is excluded from the
            requested test. “Unverified” means the complete net could not be
            calculated; it does not mean zero. Source:{' '}
            <SourceLink id="statements" />.
          </p>
          <details className="history">
            <summary>Earlier quarters · launch through Q2 2024</summary>
            <RevenueTable indices={earlier} />
          </details>
          <div className="quarter-takeaway">
            <span className="label">LATEST COMPLETE QUARTER / Q2 2026</span>
            <p>
              Reported borrow fees of <strong>$997.60K</strong> plus facilitator
              yield of <strong>$402.10K</strong> give a derived DAO-interest
              proxy of <strong>$1.39970M</strong>. The statements’ broader GHO
              Earnings total is <strong>$2.86M</strong>, including GSM income
              and a treasury-interest adjustment. The sum follows the provider’s
              separate categories; non-overlap has not been independently
              audited. Neither figure is net GHO income after the requested
              costs. <Cite id="statements" />
            </p>
          </div>
          <div className="table-topline cost-heading">
            <h3>Costs: what is measured, and what is missing</h3>
            <span className="badge caution-badge">FUNDING ≠ FINAL SPEND</span>
          </div>
          <CostsTable indices={recent} />
          <p className="table-note">
            Every row: <SourceLink id="statements" />; USD, observed 5 September
            2026. A dash preserves an unreported source cell; it is not an
            assumed zero. sGHO/Merit is a funding-transfer line, not total
            actual GHO Merit payouts. Liquidity and CEX transfers may include
            recoverable inventory. stkGHO rewards are denominated in AAVE and
            valued in USD by the provider.
          </p>
          <details className="history">
            <summary>
              Earlier cost observations · launch through Q2 2024
            </summary>
            <CostsTable indices={earlier} />
          </details>
          <p className="table-note">
            * Native discount only: the v3.4 upgrade removed it around July
            2025. The transition quarter remains unverified, and historical
            foregone-interest dollars were not found. The zero shown for
            subsequent quarters is limited to that removed native mechanism; it
            does not assert that all potential reward programs cost zero.{' '}
            <Cite id="discount" />
            <Cite id="discountVote" />
          </p>
          <div className="two-col prose-grid">
            <div>
              <h3>Why the cost columns cannot be summed into profit</h3>
              <p>
                The statements define sGHO/Merit recognition at transfer to the
                incentive manager. Other ACI and Merkl lines span multiple
                assets. No complete GHO-only distribution reconciliation was
                available. Unspent manager balances, overlap and inventory
                returns need adjustment. <Cite id="statements" />
              </p>
              <p>
                For example, the small sGHO line cannot represent the entire
                Merit program: ACI described a much larger annual incentive
                program. The annual GHO-attributed protocol-revenue headline of
                $12.7M for 2025 is also not explicitly a pure-borrow-interest
                figure. <Cite id="transparency" />
              </p>
            </div>
            <div>
              <h3>Keep remaining deductions open</h3>
              <p>
                The general statements include a separate ALC GHO liquidity
                payment line and protocol-wide Umbrella expenses, but the GHO
                allocation and overlap are unresolved. Their source observations
                are preserved in the repository dataset.{' '}
                <Cite id="statements" />
              </p>
              <p>
                No complete quarterly realized GHO bad-debt or GSM
                operating-cost ledger was located. A reported incident without
                loss and an outstanding-deficit table that omits GHO cannot
                establish zero losses for every quarter. <Cite id="pause" />
                <Cite id="deficits" />
              </p>
            </div>
          </div>
          <details className="history">
            <summary>Known operational item · GhoRouter audit</summary>
            <p className="detail-copy">
              The April and June 2026 funding updates report audit
              reimbursements of 21,322.38 GHO and 11,655 GHO: a derived total of
              32,977.38 GHO. These are token amounts, not independently valued
              historical USD expenses. The router serves both GSM swaps and
              savings flows; the GSM-only allocation, expense-incurrence dates
              and inclusion in other cost lines remain unverified. Do not add
              the amount again without reconciliation. <Cite id="auditApril" />
              <Cite id="auditJune" />
            </p>
          </details>
        </section>

        <section id="spread" className="section">
          <SectionHead
            n="04"
            title="Does the current spread support profitability?"
            sub="Contemporaneous rate observations; a displayed yield spread is not an aggregate DAO profit margin."
          />
          <div className="spread-layout">
            <figure
              className="rate-chart"
              aria-label="Reported GHO borrow and savings APYs on September 5, 2026. Core 4.08 percent; Prime 3.74; Horizon 3.05; Monad 3.88; savings 4.50."
            >
              {[
                { name: 'Ethereum Core · borrow', rate: 4.08, id: 'aave' },
                { name: 'Ethereum Prime · borrow', rate: 3.74, id: 'markets' },
                { name: 'Horizon · borrow', rate: 3.05, id: 'markets' },
                { name: 'Monad · borrow', rate: 3.88, id: 'markets' },
                { name: 'GHO Savings · payout', rate: 4.5, id: 'savings' },
              ].map((r, i) => (
                <div
                  className={`rate-row ${i === 4 ? 'savings-rate' : ''}`}
                  key={r.name}
                >
                  <div>
                    <span>
                      {r.name} <Cite id={r.id} />
                    </span>
                    <strong>{r.rate.toFixed(2)}%</strong>
                  </div>
                  <div className="rate-track">
                    <div style={{ width: `${(r.rate / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
              <p className="micro-note">
                Source labels: APY. Observed 5 September 2026. Displayed rates
                are not guaranteed future rates.
              </p>
            </figure>
            <div className="spread-reading">
              <span className="label">MATCHED-UNIT YIELD COMPARISON</span>
              <strong className="spread-value negative">
                −0.42<span> pp</span>
              </strong>
              <p>
                Core borrow APY less the displayed Savings APY: 4.08% − 4.50%.
                One borrowed GHO does not fund the savings return on one saved
                GHO at these displayed yields. <Cite id="aave" />
                <Cite id="savings" />
              </p>
              <p>
                That comparison alone does not prove DAO-wide profitability or
                loss. Borrow balances, savings balances, facilitator ownership,
                other incentives and GSM backing all differ.
              </p>
            </div>
          </div>
          <div className="two-col prose-grid">
            <div>
              <h3>Utilization needs a denominator</h3>
              <p>
                The official Core page shows 111.56M GHO debt against a 150.00M
                borrow cap: 74.37% cap usage. This is minting headroom, not
                conventional supplier utilization. TokenLogic shows Prime at
                86%, Horizon at 54% and Monad at 88% utilization, each with its
                own market denominator. <Cite id="aave" />
                <Cite id="markets" />
              </p>
            </div>
            <div>
              <h3>The forward cost hurdle</h3>
              <p>
                Aave’s Savings banner shows $161.64M of deposits at 4.50% APY.
                Holding the displayed balance and yield constant for a year
                implies approximately $7.27M of savings returns, before other
                incentives or costs. This is a scenario, not a forecast. This
                uses the banner’s USD valuation and does not reconstruct
                historical payment-date costs. <Cite id="savings" />
              </p>
              <p>
                A complete forward net needs simultaneous DAO-captured borrow
                balances and rates across all facilitators, and current costs on
                a consistent scope. The evidence does not establish a
                net-positive spread under the requested formula.
              </p>
            </div>
          </div>
          <details className="history">
            <summary>
              Why the August rate proposal is not used as the executed current
              rate
            </summary>
            <p className="detail-copy">
              The 27 August proposal stages Core’s standard rate from 3.75% to
              4.00% to 4.25%, and savings from 4.25% to 4.50%. The official
              current Core display is 4.08% APY. The proposal also calls 4.50%
              savings “below” 4.25% Core and gives conflicting timing
              descriptions. Its annual revenue-impact narrative is not a clean
              realized P&amp;L. We preserve it as a dated proposal, without
              silently correcting it or assuming every step executed.{' '}
              <Cite id="august" />
              <Cite id="aave" />
            </p>
          </details>
        </section>

        <section id="claims" className="section">
          <SectionHead
            n="05"
            title="What governance actually claimed"
            sub="Forecasts, narrower self-sufficiency claims and achieved profit are different evidence."
          />
          <div className="timeline">
            <article>
              <time>JUL 2024</time>
              <div>
                <span className="badge">FORECAST</span>
                <h3>A projected break-even threshold</h3>
                <p>
                  ACI anticipated break-even around 150–175M GHO supply. It was
                  a forward estimate, not proof of a quarter’s realized net
                  income. <Cite id="forecast" />
                </p>
                <SourceLink
                  id="aavenomicsVote"
                  label="Related Snapshot proposal"
                />
              </div>
            </article>
            <article>
              <time>MAR 2025</time>
              <div>
                <span className="badge">NARROWER CLAIM</span>
                <h3>Merit called self-sufficient</h3>
                <p>
                  The proposal compared a $12M annual Merit budget with
                  approximately $12M of annualized interest at a non-discount
                  rate. The same document acknowledged broader Merit/ALC
                  deficits and treated profitability as a future goal.{' '}
                  <Cite id="meritClaim" />
                </p>
                <SourceLink
                  id="partOneVote"
                  label="Related Snapshot proposal"
                />
              </div>
            </article>
            <article>
              <time>SEP 2025</time>
              <div>
                <span className="badge">STILL APPROACHING</span>
                <h3>A path toward incentive break-even</h3>
                <p>
                  TokenLogic’s liquidity funding proposal described GHO as
                  moving closer to break-even on incentives. This is not an
                  all-cost net-profit certification. <Cite id="alc" />
                </p>
              </div>
            </article>
            <article>
              <time>MAY 2026</time>
              <div>
                <span className="badge">COST MODEL CHANGES</span>
                <h3>Native savings replaces fixed Merit funding</h3>
                <p>
                  The savings launch shifts rewards toward a deposit-dependent
                  rate. Carrying the old 275,000 GHO weekly funding rate forward
                  and adding all native savings costs would double-count the
                  replaced program. <Cite id="launch" />
                  <Cite id="may" />
                </p>
              </div>
            </article>
            <article>
              <time>SEP 2026</time>
              <div>
                <span className="badge reported">
                  POSITIVE · BROADER DEFINITION
                </span>
                <h3>A positive trailing dashboard balance</h3>
                <p>
                  The live financials dashboard shows positive annualized net
                  after its tracked expense categories, including GSM revenue.
                  It neither supplies all requested adjustments nor verifies the
                  first profitable quarter under this question’s definition.{' '}
                  <Cite id="financials" />
                </p>
              </div>
            </article>
          </div>
          <p className="table-note">
            The June 2026 GHO/Sky discussion was a community proposal, with
            speculative potential profit, not an official DAO financial report.{' '}
            <Cite id="community" /> Initial Merit funding was also put to
            Snapshot; proposal approval is spending authorization, not expense
            evidence. <Cite id="meritVote" />
          </p>
        </section>

        <section id="dashboards" className="section">
          <SectionHead
            n="06"
            title="Dashboard coverage and freshness"
            sub="Observation time is not the same as a source’s last-refresh time."
          />
          <div className="dashboard-grid">
            <article>
              <span className="badge reported">PRIMARY / P&amp;L</span>
              <h3>TokenLogic Aave Analytics</h3>
              <p>
                GHO Financials publishes a broader P&amp;L. Financial Statements
                supplies numerical quarterly rows and accounting notes. Market
                views supply current rates. Refreshed-through timestamps were
                not consistently exposed; public records extended to the
                observation date.
              </p>
              <SourceLink id="financials" />
              <br />
              <SourceLink id="statements" />
            </article>
            <article>
              <span className="badge reported">PRIMARY / MARKETS</span>
              <h3>Aave’s own analytics</h3>
              <p>
                Official Core reserve data and the Markets savings banner were
                readable on the observation date. Neither establishes a
                historical full net GHO income series.
              </p>
              <SourceLink id="aave" />
              <br />
              <SourceLink id="savings" />
              <br />
              <SourceLink id="gho" />
            </article>
          </div>
          <div id="dune-coverage" className="coverage-extra">
            <h3 className="table-topline">Dune and Chaos Labs audit</h3>
            <Table className="research-table coverage-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Owner / dashboard</TableHead>
                  <TableHead>Dashboard last edited (UTC)</TableHead>
                  <TableHead>Coverage and query freshness</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <SourceLink id="duneAave" />
                    <p>The official Aave app links @aavelabs.</p>
                  </TableCell>
                  <TableCell className="date-cell">
                    2024-05-25
                    <br />
                    18:01:59
                  </TableCell>
                  <TableCell>
                    Supply, holders and facilitators. No full P&amp;L. Exact
                    query-refresh timestamp not retrieved.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <SourceLink id="duneTokenlogic" />
                  </TableCell>
                  <TableCell className="date-cell">
                    2025-08-05
                    <br />
                    08:19:48
                  </TableCell>
                  <TableCell>
                    Avalanche GHO supply, debt, mint/burn. Query cards required
                    a run; results unavailable anonymously.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <SourceLink id="duneSteakhouse" />
                  </TableCell>
                  <TableCell className="date-cell">
                    2024-08-05
                    <br />
                    15:26:48
                  </TableCell>
                  <TableCell>
                    Stablecoin usage and destinations. No verified GHO full
                    P&amp;L; exact query refresh unverified.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Chaos Labs on Dune</TableCell>
                  <TableCell className="date-cell">Unverified</TableCell>
                  <TableCell>
                    Targeted owner and GHO searches did not locate an
                    attributable complete GHO P&amp;L. This is not proof none
                    exists.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <SourceLink id="chaos" />
                  </TableCell>
                  <TableCell className="date-cell">Unverified</TableCell>
                  <TableCell>
                    The separate risk dashboard did not resolve in the browser.
                    Its historical launch article describes risk monitoring, not
                    a P&amp;L. <Cite id="chaosLaunch" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="table-note">
              Checked 5 September 2026. Dune dates above are dashboard edit
              timestamps read from the page, not query-run timestamps. No
              current financial figures were inferred from stale or unavailable
              query cards.
            </p>
          </div>
        </section>

        <section id="confidence" className="section">
          <SectionHead
            n="07"
            title="How much confidence to place in the answer"
            sub="No source located publishes a reconciled net GHO P&amp;L matching every requested term."
          />
          <div className="confidence-grid">
            <div>
              <span className="badge reported">HIGH · SOURCE OBSERVATIONS</span>
              <h3>What the sources display</h3>
              <p>
                Quarterly revenue rows, named transfer categories, live APYs and
                governance statements. Values are preserved at their displayed
                precision and linked to the source.
              </p>
            </div>
            <div>
              <span className="badge derived">
                MEDIUM · PARTIAL RECONSTRUCTION
              </span>
              <h3>What the arithmetic supports</h3>
              <p>
                Removing the displayed GSM income changes the recent dashboard
                balance from positive to negative. This is reliable arithmetic
                on rounded, scope-limited inputs.
              </p>
            </div>
            <div>
              <span className="badge caution-badge">
                LOW / UNVERIFIED · COMPLETENESS
              </span>
              <h3>What remains unresolved</h3>
              <p>
                Actual GHO Merit spending, transfer-versus-expense
                reconciliation, all-facilitator coverage, historical subsidy
                cost, realized loss ledger, GSM operations and a first
                profitable quarter.
              </p>
            </div>
          </div>
          <div className="conclusion">
            <span className="label">ANSWER TO THE RESEARCH QUESTION</span>
            <h2>
              A “yes, profitable since quarter X”
              <br />
              is not supported by this evidence.
            </h2>
            <p>
              There is a positive recent balance under TokenLogic’s broader
              definition. The narrower borrow-only diagnostic is negative within
              that dashboard’s scope. The complete DAO-wide net and its first
              profitable quarter remain unverified.
            </p>
          </div>
        </section>

        <section id="sources" className="section">
          <SectionHead
            n="08"
            title="Source register"
            sub="All sources checked on 5 September 2026. Publication dates and observation dates are kept separate."
          />
          <div className="source-register">
            {Object.entries(sources).map(([id, s]) => (
              <article id={`source-${id}`} key={id}>
                <span className="source-index">
                  {sourceNumbers[id].toString().padStart(2, '0')}
                </span>
                <div>
                  <SourceLink id={id} />
                  <p className="source-date">{s.date}</p>
                  <p>{s.note}</p>
                </div>
              </article>
            ))}
          </div>
          <div id="scope" className="scope-note">
            <h3>Scope and refresh policy</h3>
            <p>
              This is a hosted research snapshot, not an automatically refreshed
              feed. The requester supplied the circulating-supply and
              fee-adapter anchors; those were accepted, not re-derived.
              Protocol-wide fee and revenue totals are not used as GHO-specific
              revenue. Every quoted or derived monetary amount elsewhere has a
              source reference, reporting context and the common observation
              date above.
            </p>
            <p>
              The source repository preserves the transcribed data, distinctions
              between token units and USD, and methodology notes. A future
              update should reconcile facilitator coverage, obtain exact
              exports, match reward distributions to budgets, remove recoverable
              principal and reconcile bad debt and operating costs before
              assigning a first profitable quarter.
            </p>
          </div>
        </section>
        <footer>
          <a href="#top">GHO / ECONOMICS</a>
          <span>
            Independent analysis · Not affiliated with Aave or TokenLogic
          </span>
          <a href="https://github.com/0xFrostytie/gho-profitability">
            Public research &amp; source <ArrowUpRight size={14} />
          </a>
        </footer>
      </div>
    </main>
  );
}
