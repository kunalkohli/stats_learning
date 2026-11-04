export type TeachingRow = { concept: string; emoji: string; meaning: string; example: string };
export type LessonCaseStudy = { title: string; description: string; rows: { emoji: string; label: string; text: string }[] };
export type TeachingTableData = { label: string; firstColumn?: string; meaningColumn?: string; rows: TeachingRow[] };
export type BaselineRow = { name: string; emoji: string; rule: string; assumption: string; example: string };
export type LessonTeaching = { table: TeachingTableData; secondary?: TeachingTableData; pointExamples: { emoji: string; example: string }[]; caseStudy?: LessonCaseStudy; baselineComparison?: BaselineRow[]; why?: string; overview?: TeachingTableData; how?: { label: string; text: string }[] };
type TeachingLesson = { slug: string; title: string; intro: string; points: { title: string; text: string }[] };
type Example = readonly [emoji: string, example: string];

// Authored examples, not measured business results. Positions match each lesson's points.
const forecasting: Record<string, readonly Example[]> = {
  "forecast-is-a-range": [
    ["↔️", "Northstar compares a quiet Tuesday with a busy one rather than staffing as though exactly $32,000 must occur. An interval is about possible sales, not a guaranteed minimum or maximum."],
    ["🗓️", "Tomorrow's order pipeline is partly visible; a forecast six weeks out also depends on future promotions and demand changes. The playground lets Northstar inspect how illustrative uncertainty grows with the horizon."],
    ["🧭", "Established categories have repeated weekly patterns and sales history. A newly launched product deserves wider uncertainty and explicit assumptions, not the same confidence as a mature category."],
  ],
  "trend-seasonality-noise": [
    ["📈", "More repeat buyers could lift Northstar's ordinary-day sales over several years, even after removing the usual holiday shopping ramp."],
    ["🔁", "Weekly shopping habits repeat, while Black Friday needs its actual moving date and event-relative window rather than a fixed November date."],
    ["🌊", "A prolonged spending slowdown could be a non-calendar cycle. An unexpected checkout outage belongs in the unexplained remainder; neither is automatically an annual seasonal pattern."],
    ["⚖️", "An additive weekend effect might add $2,000 at any business size. A 10% multiplicative effect adds $2,000 on a $20,000 base but $4,000 on a $40,000 base."],
  ],
  "trend-or-seasonality": [
    ["🔎", "Northstar inspects several full years before extending an October–November climb into January. A repeated post-holiday decline would argue against permanent acceleration."],
    ["📅", "Compare Black Friday with Black Friday and Mondays with Mondays. November 27 in one year may not represent the same shopping event in another."],
    ["🧱", "If Northstar enters a new country or changes prices, the old sales level may no longer describe the current business. Keep the history but model the change explicitly."],
  ],
  "decomposition": [
    ["〰️", "A centered seven-day average can reveal Northstar's slower-moving level, but Wednesday's value uses days through Saturday, so it is not a real-time feature for Wednesday."],
    ["🧩", "Remove weekly and yearly patterns separately; add Black Friday indicators rather than expecting a weekly decomposition to explain a moving annual promotion."],
    ["🔍", "A recurring Cyber Monday spike in the remainder suggests a missed event effect. It is unexplained by this model, not necessarily unpredictable."],
  ],
  "baselines": [
    ["📍", "Northstar's simplest benchmark predicts tomorrow using today's sales. It may be useful, but it also repeats any unusual outage or promotion from today."],
    ["🔁", "Copy last Monday for next Monday to preserve weekday patterns. For Black Friday, align the event instead of blindly copying sales from 364 days earlier."],
    ["🌱", "If Northstar assumes 12% growth on last year's event-aligned sales, that rate must come from information available before the forecast—not next month's realized results."],
  ],
  "growth-rates": [
    ["📅", "Compare Northstar's Black Friday weekend with the prior Black Friday weekend, not an ordinary November weekend with a promotion weekend."],
    ["⚖️", "A recent growth estimate may notice a new market quickly; a longer estimate may be steadier. Backtest both on the inventory horizons Northstar actually uses."],
    ["🧮", "If Northstar grows 18% annually, use approximately 1.39% per month when translating that assumption—not 18% every month."],
  ],
  "backtesting": [
    ["🚧", "Build a forecast using Northstar's sales through September, then evaluate October. October cannot also be used to choose the September forecast's features."],
    ["⏩", "Repeat a 28-day forecast from several historical cutoffs, refitting each pipeline using only data available before that cutoff."],
    ["📦", "A model chosen for tomorrow's staffing is not automatically suitable for a six-week supplier order. Test each decision's lead time."],
  ],
  "error-metrics": [
    ["📏", "MAE expresses Northstar's typical absolute revenue miss in dollars. RMSE places more emphasis on a very large Black Friday miss."],
    ["🧭", "Consistently positive actual-minus-forecast errors mean Northstar is underpredicting. Big positive and negative errors can cancel without producing a good forecast."],
    ["⚠️", "A low-volume product with near-zero sales can make percentage errors unstable. A scaled metric needs a baseline estimated from Northstar's training data."],
  ],
  "autocorrelation": [
    ["↩️", "For Northstar's daily data, lag 7 pairs this Monday's sales with last Monday's. Lag 1 pairs today with yesterday."],
    ["🔎", "Two adjacent high sales days may simply share a growing business level. Remove trend and known seasonal effects before calling that useful short-run memory."],
    ["🔗", "After adjustment, compare direct lag relationships with indirect ones. The pure AR(1) identity ACF(k) = φ^k is a teaching case, not a rule for Northstar's raw sales."],
    ["🎲", "One ACF spike in a large collection of tested lags can arise by chance. Check repeated structure and future forecast performance before adding a lag."],
  ],
  "residuals": [
    ["🧹", "If Northstar's model is systematically too low on Mondays, a useful weekly signal remains in its residuals."],
    ["🕸️", "No linear lag correlation does not prove that Northstar's remaining errors are independent; changing volatility can still carry structure."],
    ["🧪", "A model can pass a residual check but lose to seasonal naïve on the next Black Friday. Diagnostics and out-of-sample testing answer different questions."],
  ],
  "stationarity": [
    ["📐", "If Northstar's fluctuations grow proportionally with sales, a suitable transformation may stabilize their scale. Check positivity before using logs."],
    ["➖", "A weekly difference compares today's sales with seven days earlier, helping remove a stable weekday pattern before modeling remaining dependence."],
    ["⚠️", "A permanent pricing change is not a reason to difference Northstar's sales repeatedly until a chart looks flat. Diagnose the structural change first."],
  ],
  "base-effects": [
    ["🧮", "If last year's Black Friday checkout outage depressed sales, this year's large growth rate partly describes the unusually low comparison base."],
    ["🗓️", "Northstar compares event-aligned sales levels across several years before extending one dramatic year-over-year percentage into next year's plan."],
    ["📦", "A product selling zero units while out of stock does not imply zero demand. Availability constraints must be distinguished from customer interest."],
  ],
  "exponential-smoothing": [
    ["🎚️", "A high alpha reacts quickly if Northstar's ordinary sales level changes, but it can also overreact to one unusually busy day."],
    ["➖", "On a suitably adjusted series with no clear trend, SES projects Northstar's latest estimated level forward rather than inventing a seasonal rhythm."],
    ["🎁", "Treat Black Friday as a known event instead of allowing its sales peak to permanently reset Northstar's ordinary-day level."],
  ],
  "holt": [
    ["📈", "Holt can track Northstar's current sales level and the estimated daily growth in that level, instead of giving every future date the same number."],
    ["🛑", "A newly observed rapid growth slope may be plausible for a month, not indefinitely. Damping reduces its contribution further into Northstar's future."],
    ["🔁", "A rising December sales curve may still contain holiday seasonality. Holt's trend alone does not explain why January repeatedly falls."],
  ],
  "holt-winters": [
    ["📆", "A weekly Holt–Winters model maintains separate weekday effects for Northstar's Monday-through-Sunday shopping rhythm."],
    ["🧩", "A seven-day seasonal model cannot also be assumed to know Northstar's annual holiday ramp and moving Black Friday event."],
    ["⚖️", "If weekends add a similar dollar amount at every sales level, additive effects may fit. If the uplift scales with Northstar's size, proportional effects deserve investigation."],
  ],
  "fourier": [
    ["🌊", "Northstar can start with a few smooth annual waves, then add harmonics only if time-aware tests show that the extra seasonal flexibility helps."],
    ["🗓️", "Use weekly waves and annual waves together to describe different repeating shopping patterns in the same daily sales series."],
    ["🎁", "Use a named event window for the sharp Black Friday lift instead of adding many smooth annual waves to chase its spike."],
  ],
  "events-holidays": [
    ["📍", "Represent Northstar's Black Friday lead-up, Friday, weekend, and Cyber Monday by their distance from the actual event date."],
    ["🔮", "Northstar knows next year's Black Friday date now, but not the resulting sales. Discount depth and ad spending may need explicit scenarios."],
    ["🧪", "A large holiday-promotion coefficient does not prove the promotion caused all the extra sales; Northstar may have scheduled it during an already busy season."],
  ],
  "model-families": [
    ["🧩", "ETS lets Northstar represent evolving level, trend, and specified seasonal components rather than treating the whole sales line as one pattern."],
    ["↩️", "ARIMA investigates temporal dependence remaining in Northstar's appropriately differenced or adjusted series."],
    ["🗂️", "A regression can use known calendar dates and planned discounts. It cannot legitimately use next week's realized ad clicks to predict next week."],
  ],
  "ets": [
    ["🔤", "Northstar reads ETS(A,N,A) as additive error, no trend, and additive seasonality, rather than treating ETS as a single fixed model."],
    ["↔️", "Two ETS choices can have similar point forecasts for Northstar but imply different uncertainty, so compare their interval behavior too."],
    ["🧪", "A lower training AICc can motivate a candidate; Northstar still checks whether its chosen model forecasts future event periods usefully."],
  ],
  "arima": [
    ["↩️", "An AR term can use Northstar's recent adjusted-sales deviations as predictors instead of assuming every recent deviation immediately disappears."],
    ["🔗", "In the stationary pure AR(1) teaching process, lag-one correlation equals φ. Do not transfer that shortcut to Northstar's trending, seasonal raw sales."],
    ["➖", "If Northstar models changes in sales, it must undo the differencing to express forecasts back in revenue levels."],
    ["💡", "ARIMA's MA term uses past unexpected forecast innovations. It is not the seven-day rolling mean Northstar plots on a dashboard."],
    ["🧮", "With mean $30k, current level $35k, and φ = 0.7, the supplied AR(1) conditional mean is $33.5k tomorrow—not a guarantee of tomorrow's sales."],
  ],
  "sarima": [
    ["📅", "For Northstar's daily observations, seasonal period 7 represents weekly shopping memory; ordinary and seasonal lag orders play separate roles."],
    ["🚧", "Future Black Friday dates can be predictors. Future realized competitor prices cannot be treated as known unless Northstar actually had them at the forecast origin."],
    ["🌊", "For daily sales with weekly and yearly patterns, Northstar can compare Fourier/event regressors with ARIMA errors instead of forcing a huge annual seasonal lag structure."],
  ],
  "dynamic-harmonic-regression": [
    ["🧩", "Fourier and event features explain Northstar's repeating calendar shape; ARIMA errors handle remaining serial dependence after that regression."],
    ["🎚️", "Northstar selects the number of seasonal waves inside validation rather than choosing the order that best fits the held-out Black Friday period."],
    ["🔁", "A fitted standard DHR seasonal shape repeats with fixed coefficients. If Northstar's weekday habits evolve, that needs an explicit adaptation or another approach."],
  ],
  "prophet": [
    ["📈", "A Northstar market launch may change the growth slope; overly flexible changepoints can also chase a short promotion spike."],
    ["🎁", "Give Prophet Northstar's actual Black Friday event dates and windows instead of assuming smooth annual seasonality will identify them exactly."],
    ["↔️", "Northstar evaluates whether Prophet's intervals cover held-out outcomes, especially when future trend behavior differs from fitted history."],
  ],
  "mstl-ets": [
    ["🧩", "At each Northstar backtest cutoff, estimate weekly and annual components using only the available training history—not the later evaluation dates."],
    ["📈", "After removing seasons, Northstar still forecasts the underlying sales level/trend plus remainder, rather than trying to forecast the remainder alone."],
    ["🔁", "Repeat the latest estimated weekly and annual component cycles, forecast the adjusted series, and add the pieces back on a consistent scale."],
    ["🎁", "A repeated annual slot will not always land on Black Friday. Northstar handles the moving event explicitly and tests the final recombined intervals."],
  ],
  "prophet-dhr-mstl": [
    ["🗺️", "A historical seasonal plot that changes over time does not prove Northstar's pipeline predicts future changes in that pattern. Check each method's actual projection rule."],
    ["🛠️", "If Northstar's adjusted residuals still have memory, DHR's ARIMA errors are a motivated candidate; that is a reason to test it, not declare it the winner."],
    ["⚖️", "Compare Prophet, DHR, and MSTL + ETS on the same Northstar forecast origins, horizons, calendars, and baselines, with every pipeline refit inside training windows."],
  ],
  "prediction-intervals": [
    ["↔️", "Northstar needs a range for actual next-Tuesday sales, not just a confidence interval around an estimated long-run average."],
    ["🎯", "Check coverage over many held-out Northstar forecasts. A needlessly huge interval can cover outcomes while offering little help to planners."],
    ["📦", "To estimate monthly uncertainty, Northstar combines coherent simulated daily paths rather than adding daily 80% lower and upper endpoints."],
  ],
  "drivers-leakage": [
    ["🚧", "Northstar can know a planned discount and the calendar before launch, but not the realized conversion rate of shoppers who have not arrived yet."],
    ["🔮", "If the ad budget is undecided, show low- and high-spend scenarios rather than quietly assuming the budget that eventually happened."],
    ["🧪", "Refit Northstar's transformations and feature preparation inside each backtest window; even a centered moving average can accidentally use future sales."],
  ],
  "hierarchical-forecasts": [
    ["🧮", "Northstar's Home, Electronics, and other category forecasts should sum to the same total used by the company planning team."],
    ["🧱", "Forecast each Northstar product and sum upward, while recognizing that tiny products can be much noisier than aggregate sales."],
    ["🔗", "Use forecast-error relationships across Northstar's levels to reconcile base forecasts, then check whether the coherent result is also accurate."],
  ],
  "machine-learning": [
    ["⏱️", "Northstar can use past-only lags, known holidays, and planned promotions. A direct 28-day forecast and repeated one-day recursion need separate evaluation."],
    ["🌐", "A model trained across Northstar's related products may help a sparse category, provided the test includes the kinds of new or changing products it will actually face."],
    ["🤝", "Average sensible Northstar forecasts as a benchmark; learn combination weights from training/validation, never the future period used to report the final score."],
  ],
  "forecast-plan-target": [
    ["🗂️", "Northstar can expect $1.1m, target $1.3m, and plan a promotion to close part of the gap. The target alone does not create a higher unbiased forecast."],
    ["⚖️", "A costly stockout may justify stocking above expected demand. That is a decision under asymmetric costs, not evidence that the expected demand estimate changed."],
    ["🔄", "Northstar records the plan, actual outcome, forecast errors, and any overrides so next month's decision can learn from more than a headline accuracy score."],
  ],
  "forecasting-workflow": [
    ["🎯", "Northstar first specifies the decision: daily staffing, a 28-day purchase order, or monthly finance planning. Each implies different useful horizons and tolerances."],
    ["🔎", "Inspect Northstar's missing days, stockouts, weekly rhythm, and Black Friday timing before choosing a simple event-aware baseline."],
    ["🧪", "Test future periods from several historical origins, then ask whether Northstar's misses are bias, omitted events, missing seasons, or residual dependence."],
    ["🛠️", "Add a calendar feature for a missed event or an error model for remaining memory. Do not climb a mandatory model-complexity ladder."],
    ["🏁", "If a simple baseline best supports Northstar's decision after honest tests, keep it. Refit, monitor, and revisit the choice when the business changes."],
  ],
};

const experimentation: Record<string, readonly Example[]> = {
  "why-randomize": [
    ["🔀", "Northstar cannot observe the same buyer using old and new infrastructure at the same moment. Randomly assigned control buyers stand in for that missing alternative."],
    ["👥", "Sending mostly premium buyers to Northstar's new cache can create an apparent conversion win even if the cache changes nobody's purchase behavior."],
    ["🎲", "Assign eligible Northstar buyers by chance before exposure, then audit routing and logs. Randomization balances the mix in expectation, not perfectly in every sample."],
  ],
  "hypothesis-and-metrics": [
    ["🔗", "Northstar's proposed chain is cache change → faster product pages → less abandonment → more purchasers. A latency improvement alone does not confirm every link."],
    ["🛒", "Count whether each eligible assigned Northstar buyer completes an order within seven days of first eligibility; wait for that window to mature."],
    ["📋", "Before launch, Northstar records conversion as primary, worthwhile effect size, guardrail margins, sample/duration, assignment unit, and stopping rule."],
  ],
  "assignment-unit": [
    ["🔒", "A stable Northstar buyer ID stays on the same cache variant across repeat visits instead of switching treatment on every request."],
    ["👤", "One buyer's 100 Northstar requests are still one randomized buyer. Aggregate appropriately or use buyer-cluster-aware inference."],
    ["🕸️", "If the new cache changes a database queue shared with control, Northstar may need isolated pools, clusters, or randomized time blocks rather than ordinary buyer buckets."],
  ],
  "intent-to-treat": [
    ["🧾", "A Northstar buyer assigned to the new stack stays in treatment even if the system falls back to the old path."],
    ["🚫", "Dropping Northstar buyers whose treatment page failed removes a potential treatment-caused harm from the conversion denominator."],
    ["🚪", "Northstar can investigate a trigger logged symmetrically in both groups, not define treatment exposure as successfully using the new cache."],
  ],
  "conversion-and-lift": [
    ["👤", "A Northstar buyer with three orders contributes one converted buyer, not three conversions, to the seven-day buyer-conversion rate."],
    ["🧮", "Northstar's 10.0% → 10.2% example is +0.2 percentage points and +2% relative lift. The same change has two different units."],
    ["↔️", "An observed +0.2-point Northstar lift is much less precise with 1,000 buyers per arm than with hundreds of thousands."],
  ],
  "latency-percentiles": [
    ["⏱️", "Northstar's p95 page latency is a threshold for roughly 95% of measured requests, not the average latency of the slowest 5%."],
    ["⚠️", "If Northstar's slowest requests time out, a successful-request-only latency chart may improve while the full buyer experience gets worse."],
    ["👥", "Northstar must distinguish request-weighted p95 from a buyer-weighted measure and use uncertainty methods that respect repeated requests per buyer."],
  ],
  "guardrails": [
    ["🛡️", "Before testing the cache, Northstar declares an acceptable checkout-error increase, with immediate rollback rules for severe correctness incidents."],
    ["↔️", "An insignificant Northstar error increase with a wide interval still permits harm. Compare the appropriate upper bound with the declared margin."],
    ["⚖️", "Read conversion as buyer outcome, latency as mechanism, errors/stale prices as safety, and cost per buyer as economics—not a post-hoc composite win score."],
  ],
  "sample-ratio-mismatch": [
    ["⚖️", "For Northstar's configured 50/50 assignment, compare independent buyer counts with that expected split instead of requiring exact equality."],
    ["🚨", "A large allocation mismatch prompts Northstar to inspect routing, identity joins, bot filters, and differential missing logs before interpreting conversion."],
    ["🔍", "An A/A with no detected Northstar mismatch does not certify the entire pipeline; reconcile assignment, exposure, and failed-outcome records too."],
  ],
  "sampling-variation": [
    ["🎲", "Even if Northstar's cache has no true conversion effect, different random buyer samples can produce positive or negative observed lifts."],
    ["👥", "With the independent-buyer approximation, quadrupling Northstar's sample roughly halves standard error—not quarters it."],
    ["🧪", "Across many well-calibrated Northstar A/A tests, some ordinary 5% tests should still reject a true null. Evaluate the procedure across repetitions."],
  ],
  "confidence-intervals": [
    ["↔️", "Across repeated appropriate experiments, Northstar's 95% interval procedure should cover the fixed true effect about 95% of the time."],
    ["🎯", "Northstar distinguishes a tiny, precise conversion improvement from a wide interval that still permits both meaningful benefit and harm."],
    ["📐", "The normal-proportion illustration is not automatically suitable for Northstar's sparse errors, clustered regions, or repeatedly monitored sequential test."],
  ],
  "p-values": [
    ["❓", "A Northstar p-value asks how extreme the evidence would be under the specified no-effect model; it does not give the probability the cache is useless."],
    ["🎲", "A prespecified valid 5% test controls Northstar's rejection probability under a true null, not the fraction of all significant cache tests that must be wrong."],
    ["💰", "At enormous Northstar traffic, a commercially negligible lift can be statistically significant. Evaluate its size, uncertainty, cost, and operational risk."],
  ],
  "power-and-mde": [
    ["🎯", "Northstar plans to detect a 2% relative conversion lift from a 10% baseline: only 0.2 percentage points in absolute terms."],
    ["👥", "Halving Northstar's absolute planning effect approximately quadruples required independent buyers under the displayed normal-test assumptions."],
    ["📅", "Divide by newly eligible distinct Northstar buyers, not repeat requests, then allow business cycles and seven days for included outcomes to mature."],
  ],
  "underpowered-tests": [
    ["🔎", "A small Northstar test can miss an economically useful lift; a wide interval near zero does not establish equivalence."],
    ["🏆", "If Northstar discusses only significant positive cache tests, it preferentially selects estimates that favorable random noise pushed upward."],
    ["📋", "Plan the next Northstar experiment around a worthwhile plausible effect and prior uncertainty, not the unusually large lift of a lucky small-test winner."],
  ],
  "peeking-and-stopping": [
    ["👀", "Northstar can monitor outages for safety without treating every dashboard refresh as permission to claim a fixed-horizon conversion win."],
    ["🗓️", "Finish Northstar's prespecified sample, duration, and follow-up rules rather than extending only the cache tests that nearly look significant."],
    ["🚦", "If early efficacy decisions are essential, Northstar chooses a valid sequential design before launch. The independent-tests illustration is not its exact cumulative-peeking error rate."],
  ],
  "winsorization": [
    ["✂️", "Northstar caps an extreme revenue value at a declared threshold but keeps the buyer in the sample instead of deleting an inconvenient high spender."],
    ["🎯", "A new cache that helps Northstar's largest buyers may have a real uncapped-revenue effect that a capped metric largely removes."],
    ["📋", "Choose Northstar's cap using historical evidence or a valid predeclared method, not whichever cap makes the current treatment significant."],
  ],
  "cuped": [
    ["🧹", "Northstar adjusts for predictable variation from pre-test spending without selecting only high-spending buyers or redefining the business outcome."],
    ["🧮", "In the ideal one-covariate calculation, correlation 0.6 leaves 64% of Northstar's raw variance and 80% of its raw standard error."],
    ["🚧", "Last month's Northstar spend may be a useful covariate. During-test latency can be changed by treatment and is not a safe pre-treatment covariate."],
  ],
  "triggering-and-dilution": [
    ["👥", "Northstar distinguishes the effect of enabling a cache for all eligible buyers from the effect among buyers who would encounter the changed path."],
    ["🚪", "Log comparable eligibility in both Northstar arms rather than filtering treatment to buyers whose new-cache load happened to succeed."],
    ["🧮", "Affected share × local effect is a useful Northstar illustration only when the share is stable and treatment-independent and unaffected buyers truly have zero effect."],
  ],
  "ratio-metrics": [
    ["➗", "Northstar's total revenue divided by total orders is not an unweighted average of each buyer's revenue/order ratio, especially for zero-order buyers."],
    ["🛒", "If faster pages generate more small purchases, Northstar's average order value can fall while revenue per assigned buyer rises."],
    ["🔗", "A buyer-cluster bootstrap can retain the relationship between Northstar's revenue and order counts; treating the denominator as fixed misses that covariance."],
  ],
  "multiple-testing": [
    ["📋", "Northstar declares the primary metric and confirmatory segment claims before searching scores across countries, devices, and outcomes."],
    ["🛡️", "Northstar chooses family-wise error or false-discovery control according to its claims; one correction is not interchangeable with every other objective."],
    ["🔬", "A surprising Northstar mobile slice can motivate another test. A significant mobile result and insignificant desktop result alone do not prove an interaction."],
  ],
  "shared-infrastructure": [
    ["🕸️", "Northstar's new cache may reduce a database queue shared with control, helping control buyers and shrinking the measured buyer-level contrast."],
    ["🏗️", "Consider isolated pools or enough randomized infrastructure clusters for Northstar's mechanism, with inference at the actual independent unit."],
    ["⏳", "A Northstar switchback must account for cache warming, lingering state, demand cycles, and washout rather than simply alternate busy and quiet hours."],
  ],
  "segments-and-novelty": [
    ["📱", "Segment Northstar buyers by device or region recorded before exposure, not by a purchase pattern treatment could have caused during the test."],
    ["⚖️", "Compare the treatment effects between Northstar's mobile and desktop groups with an interaction analysis, not their separate significance labels."],
    ["🗓️", "Northstar predefines warmup, weekday coverage, and outcome maturation instead of dropping disappointing early cache days after seeing them."],
  ],
  "safe-rollouts": [
    ["🚦", "Northstar starts with a monitored safety canary and a tested rollback path before exposing a large share of buyers."],
    ["🧾", "Log Northstar's allocation, configuration, and capacity phase boundaries; pooling a 1% canary and a saturated full ramp blindly can change the question."],
    ["🏋️", "A buyer A/B estimates impact at tested traffic. Northstar also needs load tests and capacity evidence before assuming the same behavior at full rollout."],
  ],
  "ship-hold-or-stop": [
    ["📊", "Northstar first checks trustworthy assignment and mature outcomes, then reads conversion intervals, latency, guardrail bounds, cost, and limitations together."],
    ["⚖️", "A cost-saving Northstar migration with conversion non-inferiority is a different predeclared objective from proving a conversion uplift."],
    ["⏸️", "If Northstar's error bound permits unacceptable harm or logs are biased, hold or redesign; extra buyers do not repair broken measurement."],
  ],
  "experimentation-workflow": [
    ["📝", "Before Northstar changes routing, specify the causal question, shared resources, buyer population, conversion window, guardrails, sample, and stopping rule."],
    ["🚦", "Validate Northstar's instrumentation, canary safely, audit SRM and missing outcomes, and keep buyers in their intended assignment groups."],
    ["🔄", "Estimate with the right unit and metric, apply Northstar's original decision rule, preserve a decision record, and monitor the actual rollout."],
  ],
};

export const forecastCaseStudy: LessonCaseStudy = {
  title: "📦 Northstar’s planning decision",
  description: "Imagine Northstar's operations team preparing for next Tuesday. It needs a realistic view of demand before committing money and capacity—not a promise that one precise sales number will happen.",
  rows: [
    { emoji: "🏪", label: "The business", text: "Northstar is a fictional online retailer. Daily sales vary with the customer base, weekday shopping habits, prices, promotions, holidays, and unexpected events." },
    { emoji: "🗓️", label: "The question", text: "Given the information available today, what daily sales revenue is plausible next Tuesday? State the date, revenue units, and assumptions; a forecast for next month answers a different question." },
    { emoji: "🎯", label: "One-number answer", text: "‘We expect $32,000 in sales’ is a point forecast: one central estimate, not an exact outcome or a guaranteed minimum. This is an illustrative teaching number, not a fitted Northstar business result." },
    { emoji: "↔️", label: "A more useful answer", text: "Add a prediction interval to show plausible future daily sales under the model and assumptions. A calibrated 80% procedure should cover about 80% of outcomes over repeated forecasts; individual misses are expected." },
    { emoji: "🚧", label: "What could change it?", text: "An unplanned discount, an outage, or different customer demand could change sales. Say which promotions and calendar events were known when the forecast was made, and use scenarios for uncertain inputs." },
    { emoji: "📦", label: "How the team uses it", text: "Use the central estimate as a planning anchor and inspect low/high scenarios before committing capacity. Staffing and stock decisions also need order counts, units, product mix, and costs—not revenue alone." },
  ],
};

export function getLessonTeaching(journey: "forecasting" | "experimentation", lesson: TeachingLesson): LessonTeaching {
  const examples = (journey === "forecasting" ? forecasting : experimentation)[lesson.slug];
  if (!examples || examples.length !== lesson.points.length) throw new Error(`Missing teaching examples for ${journey}/${lesson.slug}`);
  const pointExamples = examples.map(([emoji, example]) => ({ emoji, example }));
  const table: TeachingTableData = { label: `${lesson.title}: concepts and Northstar examples`, rows: lesson.points.map((p, i) => ({ concept: p.title, meaning: p.text, ...pointExamples[i] })) };
  if (journey === "forecasting" && lesson.slug === "growth-rates") return { table, pointExamples, why: "If Northstar's comparable-month growth rises from 10% to 13%, 16%, then 19%, the average describes an earlier pace—not today's pace. Averaging is useful when variation is mostly noise, but can lag a changing pattern.", overview: { label: "Choosing a growth rate", firstColumn: "Growth rule", rows: [
    { concept: "Average all months", emoji: "⚖️", meaning: "Stable and smooths random variation, but adapts slowly to a changing rate.", example: "Use Northstar's past comparable-month YoY rates when they fluctuate around a reasonably stable level." },
    { concept: "Recent months", emoji: "🗓️", meaning: "Adapts to acceleration or slowdown with less averaging; can be noisier.", example: "Northstar considers the last three available YoY rates after a new market changes its growth pace." },
    { concept: "Latest month", emoji: "⚡", meaning: "Reacts fastest, but one unusual observation can dominate.", example: "A Northstar sale or weak comparison base can make the latest rate unrepresentative of next month." },
  ] }, how: [{ label: "Compare like with like", text: "Estimate growth from aligned weekdays, promotions, and moving events. Investigate whether a rising rate reflects real acceleration or an unusually weak base period." }, { label: "Apply the assumption once per period", text: "An annual growth assumption g scales an aligned prior-year value by (1 + g). Two years compounds by (1 + g)²; a supplied annual rate is not a monthly rate." }] };
  if (journey === "forecasting" && lesson.slug === "error-metrics") return { table, pointExamples, why: "Accuracy says how much Northstar misses; bias says which way. Forecasting 90 when actual sales are 100 gives an error of +10. A forecast can have tolerable average absolute error and still underpredict every month.", overview: { label: "Forecast accuracy and direction", firstColumn: "Metric", rows: [
    { concept: "MAE", emoji: "📏", meaning: "Mean absolute error: average size of the miss in the original units.", example: "Interpret Northstar's miss in dollars or index points, but do not compare raw MAE across businesses of very different sizes." },
    { concept: "RMSE", emoji: "💥", meaning: "Square errors, average them, then take the square root; large misses get more influence.", example: "One very large Black Friday miss can dominate Northstar's RMSE. That may match business costs—or hide typical-day behavior." },
    { concept: "MAPE", emoji: "⚠️", meaning: "Mean absolute error as a percentage of each actual observation.", example: "Near-zero Northstar sales produce extreme percentages; an actual of zero makes the ordinary formula undefined." },
    { concept: "WAPE", emoji: "🧮", meaning: "Sum of absolute errors divided by sum of absolute actuals.", example: "Larger Northstar sales months contribute more to this aggregate score. It is still undefined when aggregate actuals are zero." },
    { concept: "MASE", emoji: "⚖️", meaning: "Test MAE divided by a naïve error scale computed on training history.", example: "Below one means Northstar's test MAE is smaller than that training scale. It is not automatic proof of beating a naïve forecast on the same holdout." },
    { concept: "Bias", emoji: "🧭", meaning: "Mean signed error, using actual minus forecast.", example: "Positive means Northstar underpredicts on average. Opposite misses can cancel, so pair bias with an accuracy score." },
  ] }, how: [{ label: "Keep units and signs visible", text: "For actual 100 and forecast 90, error is +10: underprediction. MAE and RMSE are both 10 for that single observation; its absolute percentage error is 10%." }, { label: "Use several complementary views", text: "Inspect a typical-error measure, the cost of large misses, signed bias, and an honest baseline comparison on the same unseen period. Pick metrics for the decision, not for the most flattering score." }] };
  if (journey === "forecasting" && lesson.slug === "backtesting") return { table, pointExamples, why: "One Northstar holdout can be unusually easy or difficult. Rolling-origin backtesting repeats the experiment from several historical dates, refitting each time and grouping errors by forecast horizon.", overview: { label: "Holdout and rolling-origin evaluation", firstColumn: "Evaluation", rows: [
    { concept: "Single holdout", emoji: "🚧", meaning: "Reserve the later observations; fit on the earlier ones and forecast the reserved period.", example: "Pretend Northstar has reached December 2024. Fit through December, forecast January–March, and compare with what later happened." },
    { concept: "Rolling backtest", emoji: "⏩", meaning: "Move the origin forward, refit using only the available past, and repeat the same horizons.", example: "Repeat Northstar's 1-, 2-, and 3-month-ahead forecasts from January's origin, then February's, and onward. Pool errors separately by horizon." },
  ] }, how: [{ label: "Test the horizon the decision needs", text: "A one-month staffing forecast and a three-month purchasing forecast can favor different methods. Longer-horizon errors often grow, but individual or averaged errors need not be monotonic." }, { label: "Keep the information boundary honest", text: "Fit transformations, decomposition, and feature preparation inside each training window. Future actuals are only for scoring. Once a method is selected honestly, refit it on all information available for the real forecast." }] };
  if (journey === "forecasting" && lesson.slug === "baselines") return { table, pointExamples, why: "A baseline is the simplest reasonable benchmark. Northstar builds it first, then asks whether a more complex model improves the same future-data decision enough to justify its cost.", baselineComparison: [
    { name: "Mean", emoji: "📊", rule: "Average of the training history", assumption: "A roughly stable level; no trend or seasonal adjustment", example: "Northstar forecasts a quiet, stable category using its historical average sales." },
    { name: "Naïve", emoji: "📍", rule: "Last observed value", assumption: "The latest level is useful; the last shock is carried forward", example: "Tomorrow's Northstar sales equal today's, even if today contained an unusual promotion." },
    { name: "Seasonal naïve", emoji: "🔁", rule: "Same position in the latest season", assumption: "The seasonal pattern repeats, without added growth", example: "Use last Monday for next Monday. For Black Friday, align the actual event rather than blindly taking a 364-day lag." },
    { name: "Drift", emoji: "📈", rule: "Last value + horizon × average change per period", assumption: "The endpoint-to-endpoint average slope continues", example: "Extend Northstar's average historical daily dollar change; this does not automatically reproduce weekly shopping patterns." },
    { name: "Seasonal naïve × growth", emoji: "🌱", rule: "Aligned prior-season value × a growth factor", assumption: "The seasonal pattern repeats and the growth assumption holds", example: "Apply a supplied 18% annual growth scenario to an aligned prior-year Northstar value. Never estimate that factor from the future holdout." },
  ] };
  if (journey === "forecasting" && lesson.slug === "trend-seasonality-noise") {
    table.label = "Sales components at Northstar"; table.firstColumn = "Component"; table.meaningColumn = "What it is";
    table.rows = [
      { concept: "Trend", emoji: "📈", meaning: lesson.points[0].text, example: pointExamples[0].example },
      { concept: "Seasonality", emoji: "🔁", meaning: lesson.points[1].text, example: pointExamples[1].example },
      { concept: "Cycle", emoji: "🌊", meaning: "A rise and fall over a non-fixed period, such as an economic cycle. Unlike seasonality, it is not tied to a reliable weekday, month, or annual calendar slot.", example: "A prolonged consumer-spending slowdown could reduce Northstar's sales for several quarters. Its duration would not be a fixed calendar season; this is a hypothetical business example, not a separate fitted simulator component." },
      { concept: "Remainder", emoji: "🎲", meaning: "What is left after the chosen components are removed: random variation, outages, one-off campaigns, and patterns the decomposition missed. Unexplained does not automatically mean pure white noise.", example: "An unexpected Northstar checkout outage can lower sales for a day. A repeatedly missed Black Friday spike, however, suggests an omitted event effect rather than meaningless randomness." },
    ];
    return { table, pointExamples, why: "The same rise in Northstar's sales could be lasting growth, a returning shopping season, a longer business cycle, or an unusual one-off. Separating them changes what you should carry into the forecast.", secondary: { label: "How seasonal effects scale", firstColumn: "Pattern", meaningColumn: "What it is", rows: [
      { concept: "Additive", emoji: "➕", meaning: "A seasonal effect adds a fixed amount, regardless of the current business level.", example: "A hypothetical Northstar weekend adds $2,000 whether ordinary sales are $20,000 or $40,000." },
      { concept: "Multiplicative", emoji: "✖️", meaning: "A seasonal effect adds a percentage, so dollar swings grow with the business. Logs of positive values can help stabilize proportional variation.", example: "A hypothetical 10% Northstar weekend lift adds $2,000 to a $20,000 base but $4,000 to a $40,000 base." },
    ] } };
  }
  return { table, pointExamples, caseStudy: journey === "forecasting" && lesson.slug === "forecast-is-a-range" ? forecastCaseStudy : undefined };
}
