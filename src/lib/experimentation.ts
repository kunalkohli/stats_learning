export type ExperimentLab = "assignment" | "metrics" | "latency" | "guardrails" | "srm" | "inference" | "power" | "simulation" | "peeking" | "variance" | "cuped" | "triggering" | "ratio" | "multiplicity" | "interference" | "segments" | "rollout" | "decision" | "workflow";
export type ExperimentLesson = {
  id: number; slug: string; title: string; heading: string; part: number; minutes: number; lab: ExperimentLab;
  intro: string; points: { title: string; text: string }[]; formula?: string; takeaway: string;
  question: string; choices: string[]; correct: number; answer: string;
};

export const experimentParts = [
  { name: "Foundations", roman: "I", color: "#5d8b74", description: "Why randomize?", range: [1, 4] },
  { name: "Measurement", roman: "II", color: "#7760ad", description: "Faster for whom, and at what cost?", range: [5, 8] },
  { name: "Inference", roman: "III", color: "#517b9c", description: "Signal or noise?", range: [9, 12] },
  { name: "Sharper estimates", roman: "IV", color: "#b18c42", description: "Same customers. More information.", range: [13, 16] },
  { name: "Hidden traps", roman: "V", color: "#b36d59", description: "Protect the comparison.", range: [17, 20] },
  { name: "In practice", roman: "VI", color: "#567b78", description: "From evidence to a decision.", range: [21, 24] },
];

export const experimentLessons: ExperimentLesson[] = [
  {
    id: 1, slug: "why-randomize", title: "Why randomize?", heading: "Comparing people who chose something is not an experiment.", part: 0, minutes: 5, lab: "assignment",
    intro: "Northstar is a fictional Amazon-like marketplace. Its infrastructure team builds a faster product-page service. Buyers who happen to reach the new service purchase more. Did speed cause that—or were they already different buyers?",
    points: [
      { title: "The counterfactual is missing.", text: "We cannot watch the same buyer use both versions at the same moment. We need a comparable group to stand in for what would have happened without the change." },
      { title: "Self-selection mixes cause and customer mix.", text: "Sending premium buyers or newer devices to the new stack can make it appear better even if it has no effect. A before/after comparison also mixes the change with campaigns, seasonality, and outages." },
      { title: "Random assignment makes a fair starting point.", text: "Assign eligible buyers to old or new infrastructure by chance. In expectation, the groups have the same mix. Real finite samples can still be imbalanced, and broken instrumentation can still ruin the test." },
    ], takeaway: "Compare randomly assigned groups, not buyers who chose different experiences.",
    question: "The faster stack has mostly premium buyers. What is the clean next step?", choices: ["Randomly assign eligible buyers to old or new", "Compare their raw conversion rates and ship", "Remove every buyer who did not purchase"], correct: 0,
    answer: "Random assignment breaks the systematic link between buyer type and treatment. Restricting to purchasers conditions on the outcome and destroys the comparison.",
  },
  {
    id: 2, slug: "hypothesis-and-metrics", title: "Hypothesis & success", heading: "A faster service is a hypothesis, not a business result.", part: 0, minutes: 6, lab: "metrics",
    intro: "The proposal: cache product details closer to buyers. The mechanism is lower waiting time; the hoped-for outcome is more completed purchases. Write both down before the first buyer enters the test.",
    points: [
      { title: "Make the chain explicit.", text: "New cache → lower product-page latency → less abandonment → higher purchase conversion. Each arrow is an assumption. Latency can improve without a detectable conversion lift." },
      { title: "Choose a primary outcome and a window.", text: "For this journey, conversion is at least one completed order within seven days of a buyer’s first eligible visit. Define eligibility before assignment and wait for every included buyer’s window to mature." },
      { title: "Precommit to a decision.", text: "Record one primary metric, the smallest worthwhile effect, duration, assignment unit, analysis method, and guardrail margins. Engineering-only improvements can justify a different predeclared objective, such as cost savings with conversion non-inferiority." },
    ], takeaway: "Define the mechanism, primary outcome, and decision rule before looking at results.",
    question: "Which is the primary business outcome in our example?", choices: ["Cache hit rate alone", "Seven-day buyer purchase conversion", "Whichever metric has the smallest p-value"], correct: 1,
    answer: "Seven-day conversion is the declared buyer outcome. Cache hit rate and latency are diagnostic mechanism metrics, not substitutes selected after seeing the result.",
  },
  {
    id: 3, slug: "assignment-unit", title: "Unit of randomization", heading: "A buyer should not switch teams on every click.", part: 0, minutes: 6, lab: "assignment",
    intro: "Northstar buyers browse repeatedly and may use several devices. Randomizing each request creates mixed experiences and correlated observations. Our default is a stable buyer-ID assignment for logged-in eligible buyers.",
    points: [
      { title: "Keep assignment sticky.", text: "Hash a stable buyer ID with an experiment-specific salt into a bucket. Route that buyer consistently throughout the test. Define anonymous users and identity changes separately rather than silently reassigning them." },
      { title: "Analyze at the unit you randomized.", text: "Ten requests from one buyer are not ten independent buyers. Aggregate outcomes per buyer or use inference that respects buyer clusters. Request-level telemetry is useful but cannot manufacture extra independent sample size." },
      { title: "Shared infrastructure can force another design.", text: "If cache, queues, sellers, or regional load connect the groups, buyer randomization may not isolate the change. Consider isolated pools, cluster assignment, or time-block switchbacks with appropriate inference." },
    ], takeaway: "Choose an assignment unit that matches exposure, and respect it in analysis.",
    question: "A buyer makes 100 requests. How many independent randomized buyers is that?", choices: ["100", "It depends only on the number of page views", "One"], correct: 2,
    answer: "One buyer was randomized. Their requests are correlated; an independent-request standard error would usually be overconfident.",
  },
  {
    id: 4, slug: "intent-to-treat", title: "Intent to treat", heading: "Count everyone assigned, including the unlucky buyers.", part: 0, minutes: 6, lab: "triggering",
    intro: "Some buyers assigned to the new cache hit a fallback path. Others see a failed page and leave. Excluding those buyers can turn reliability failures into an apparent conversion improvement.",
    points: [
      { title: "Assignment defines the comparison.", text: "Intent-to-treat compares all eligible buyers by original assignment, even if delivery is imperfect. It estimates the effect of assigning the new system under the tested operating conditions." },
      { title: "Do not select on treatment outcomes.", text: "Filtering to buyers whose new page loaded successfully removes failures caused by the change. Filtering to purchasers is worse: it selects directly on the outcome." },
      { title: "Exposure analysis needs a defensible trigger.", text: "A pre-treatment eligibility condition can sharpen the question. A post-assignment trigger needs a counterfactual equivalent logged in both groups and an audit for treatment-dependent selection." },
    ], takeaway: "Keep treatment-caused failures in the result, not outside the denominator.",
    question: "Should failed new-stack loads be removed from treatment conversion?", choices: ["Yes, failures are not real exposures", "No; keep buyers in their assigned groups", "Only if removing them gives significance"], correct: 1,
    answer: "The failure is part of the treatment experience. Removing affected buyers can hide exactly the harm the experiment should detect.",
  },
  {
    id: 5, slug: "conversion-and-lift", title: "Conversion & lift", heading: "A tenth of a point is not a tenth of a percent.", part: 1, minutes: 5, lab: "metrics",
    intro: "Suppose control converts at 10.0% and treatment at 10.2%. That is a 0.2 percentage-point increase, or a 2% relative lift. Both are correct; they answer different questions.",
    points: [
      { title: "Count buyers, not orders.", text: "Seven-day buyer conversion is buyers with at least one order divided by all eligible assigned buyers with complete follow-up. Multiple orders from one buyer still contribute one conversion." },
      { title: "Keep units visible.", text: "Absolute lift is treatment rate minus control rate. Relative lift divides that difference by the control rate. A 2% relative lift from a 10% baseline is 0.2 percentage points, not 2 points." },
      { title: "Point estimates need uncertainty.", text: "The same observed lift can be compelling with many independent buyers and inconclusive with few. Do not extrapolate revenue from a noisy estimate without acknowledging its range." },
    ], formula: "absolute lift = pT − pC\nrelative lift = (pT − pC) / pC", takeaway: "Report baseline, absolute lift, relative lift, and uncertainty together.",
    question: "10.0% → 10.2% is what relative lift?", choices: ["0.2%", "2 percentage points", "2%"], correct: 2,
    answer: "(10.2 − 10.0) / 10.0 = 0.02 = 2%. The absolute change is 0.2 percentage points.",
  },
  {
    id: 6, slug: "latency-percentiles", title: "Latency & tails", heading: "The average buyer is not the buyer stuck waiting.", part: 1, minutes: 7, lab: "latency",
    intro: "A cache can make most requests faster while a few buyers wait through retries. Mean latency, median latency, and p95 latency describe different parts of that experience.",
    points: [
      { title: "A percentile is a position, not an average.", text: "p95 is a threshold at or below which about 95% of measured latencies lie. It is not the average of the slowest 5%. Define the event and sampling convention." },
      { title: "Timeouts must not vanish.", text: "A successful-request-only chart can improve because the slowest requests now fail. Track timeouts and errors alongside latency, and predefine how incomplete requests are represented." },
      { title: "Match inference to the metric.", text: "A request-weighted p95 gives heavy shoppers more weight. A buyer-weighted metric answers a different question. Quantile uncertainty needs a suitable method, such as buyer-cluster bootstrap, not a mean’s standard-error formula." },
    ], takeaway: "Inspect the tail and the failures, not just a cleaner-looking mean.",
    question: "Successful requests got faster but timeouts doubled. What does that show?", choices: ["An unqualified performance win", "A possible survivorship problem; inspect guardrails", "That p95 is the mean"], correct: 1,
    answer: "The worst experiences may have disappeared from the successful-request sample. Error and timeout metrics keep those experiences visible.",
  },
  {
    id: 7, slug: "guardrails", title: "Guardrails & trade-offs", heading: "A green speed chart cannot excuse broken checkout.", part: 1, minutes: 6, lab: "guardrails",
    intro: "Northstar wants faster pages, but not at the cost of stale prices, checkout failures, or an exploding infrastructure bill. Guardrails protect outcomes that the primary metric can miss.",
    points: [
      { title: "Declare harm margins.", text: "Set acceptable changes before launch: for example, checkout failure may rise by no more than 0.1 percentage points. Safety-critical incidents can require immediate shutdown regardless of statistical significance." },
      { title: "Not significant is not safe.", text: "A wide interval spanning substantial harm and benefit is inconclusive. Demonstrating non-inferiority requires a suitable one-sided test or confidence bound against a declared harm margin." },
      { title: "Separate benefits, costs, and safety.", text: "Conversion is our primary outcome; latency explains the mechanism; errors and stale data are guardrails; cost per buyer informs the trade-off. Do not combine them into a convenient post-hoc score." },
    ], takeaway: "Require evidence that unacceptable harm is ruled out—not merely an insignificant harm p-value.",
    question: "An error increase is not significant but its interval includes serious harm. Is safety established?", choices: ["No, uncertainty still permits unacceptable harm", "Yes, p > 0.05 proves equivalence", "Ignore errors if latency improved"], correct: 0,
    answer: "Failure to reject a zero effect is not a non-inferiority result. Check the appropriate bound against the predeclared harm margin.",
  },
  {
    id: 8, slug: "sample-ratio-mismatch", title: "A/A, logging & SRM", heading: "Before testing the idea, test the experiment.", part: 1, minutes: 7, lab: "srm",
    intro: "An A/A sends both groups through the same implementation. It helps check bucketing, logs, and analysis. In an A/B, unexpected group counts can reveal a sample ratio mismatch (SRM).",
    points: [
      { title: "Compare with the intended allocation.", text: "A 50/50 test need not have exactly equal counts. Compare observed independent assignment counts with the configured expected split using a suitable goodness-of-fit test." },
      { title: "A mismatch is a diagnostic alarm.", text: "Broken routing, bot filtering, identity joins, treatment-dependent missing logs, or eligibility differences can cause SRM. Do not repair it by arbitrarily dropping extra buyers." },
      { title: "No alarm is not a certificate.", text: "An A/A can still produce a false positive. No detected SRM does not prove correct measurement. Reconcile assignment, exposure, and outcome logs, including failures in both groups." },
    ], takeaway: "Debug assignment and missing data before interpreting a business lift.",
    question: "A severe SRM alarm appears. What next?", choices: ["Ship because conversion is significant", "Delete buyers until counts match", "Investigate the pipeline before trusting the effect"], correct: 2,
    answer: "An allocation discrepancy can mean the analyzed populations are no longer comparable. Diagnose it rather than editing the sample to look balanced.",
  },
  {
    id: 9, slug: "sampling-variation", title: "Sampling variation", heading: "A flat truth can produce a lively dashboard.", part: 2, minutes: 5, lab: "simulation",
    intro: "Imagine the infrastructure change has exactly zero conversion effect. Repeating the experiment with different buyers will still produce positive and negative estimated lifts.",
    points: [
      { title: "The estimate is random.", text: "Buyer outcomes vary even when the underlying conversion probabilities are fixed. A single observed lift combines the true effect and sampling error." },
      { title: "More buyers shrink noise.", text: "For independent, similarly distributed observations, standard error scales roughly as 1/√n. Four times the sample gives about half the standard error, not one quarter." },
      { title: "A/A is not always exactly zero.", text: "Under a valid 5% test, false positives are expected about 5% of the time under the null. Across many A/As, calibration is more informative than one surprising result." },
    ], takeaway: "Randomization enables inference; it does not eliminate randomness.",
    question: "With no true effect, can a valid test show a positive lift?", choices: ["No, randomization forces zero", "Yes, sampling variation moves the estimate", "Only when someone cheated"], correct: 1,
    answer: "Random assignment balances groups in expectation, not perfectly in every sample. Estimates fluctuate around the true effect.",
  },
  {
    id: 10, slug: "confidence-intervals", title: "Confidence intervals", heading: "The range matters as much as the dot.", part: 2, minutes: 7, lab: "inference",
    intro: "Our estimated conversion lift is 0.2 points. An interval from −0.6 to +1.0 points supports a very different decision from one spanning +0.1 to +0.3 points.",
    points: [
      { title: "Interpret the procedure.", text: "A 95% confidence procedure covers the fixed true effect in about 95% of repeated experiments under its assumptions. It does not assign a 95% probability to this realized interval containing that fixed effect." },
      { title: "Compare with zero and with worthwhile effects.", text: "An interval can exclude zero but include only commercially tiny effects. Another can include zero while still permitting an important gain or loss. ‘Not significant’ does not mean ‘no effect’." },
      { title: "Check the approximation.", text: "The playground uses a large-sample normal interval for a difference of independent buyer conversion proportions. Sparse events, clusters, sequential looks, and selection require different treatment." },
    ], formula: "estimated absolute lift ± 1.96 × estimated standard error", takeaway: "An interval shows the precision needed to distinguish useful, harmful, and unresolved outcomes.",
    question: "The interval includes zero and a meaningful benefit. What can we conclude?", choices: ["The change has exactly zero effect", "The effect is guaranteed positive", "The data are inconclusive at this precision"], correct: 2,
    answer: "Both no effect and a meaningful benefit remain compatible with the interval. More precision or a different decision objective may be needed.",
  },
  {
    id: 11, slug: "p-values", title: "P-values & alpha", heading: "How surprising are the data under no effect?", part: 2, minutes: 7, lab: "inference",
    intro: "A p-value compares the observed evidence with what a specified null model predicts. It is not the probability that the infrastructure change is useless, nor the probability a ship decision is wrong.",
    points: [
      { title: "Condition on the null.", text: "A two-sided p-value is the probability, assuming the null and test assumptions, of a test statistic at least as extreme in either direction as the observed one." },
      { title: "Alpha controls a long-run error rate.", text: "For a valid prespecified test, alpha = 0.05 limits the probability of rejecting a true null to about 5%. It does not say 5% of your significant tests are false discoveries." },
      { title: "Magnitude still matters.", text: "With huge samples, a tiny lift may have a tiny p-value. Report the effect and interval. A p-value cannot price engineering complexity, correctness risk, or operating costs." },
    ], takeaway: "A p-value measures incompatibility with a null model, not the chance your hypothesis is true.",
    question: "p = 0.03 means…", choices: ["Assuming the null, equally or more extreme evidence occurs with probability 3%", "The null has a 3% probability of being true", "There is a 97% chance of profit"], correct: 0,
    answer: "The probability is conditional on the null model and test assumptions. Reversing that conditioning is the common mistake.",
  },
  {
    id: 12, slug: "power-and-mde", title: "Power, MDE & sample size", heading: "Power: the chance you’ll notice a real effect.", part: 2, minutes: 8, lab: "power",
    intro: "Northstar expects a small conversion gain, not a miracle. At a 10% baseline, a 2% relative lift is only 0.2 percentage points. Detecting that reliably can require hundreds of thousands of buyers.",
    points: [
      { title: "Specify an effect worth finding.", text: "The minimum detectable effect (MDE) is a planning effect size tied to a desired power and test. It is not a minimum observed estimate required for significance or a guarantee that smaller effects never appear." },
      { title: "Smaller effects cost more.", text: "For this approximate two-sided 5% test at 80% power with equal groups, halving the absolute planning effect requires about four times as many independent buyers." },
      { title: "Duration is not just traffic divided by n.", text: "Use distinct eligible buyers, not requests. Include full business cycles and wait for seven-day outcomes to mature. Low volume, clustering, and exclusions can lengthen the calendar." },
    ], formula: "n per arm ≈ 2 × p(1 − p) × (1.96 + 0.842)² / absolute MDE²", takeaway: "Choose precision before launch, rather than hoping a small test will find a small effect.",
    question: "Halving the absolute MDE roughly does what to sample size?", choices: ["Halves it", "Quadruples it", "Leaves it unchanged"], correct: 1,
    answer: "Sample size scales approximately with 1/MDE², holding baseline, alpha, power, and design fixed.",
  },
  {
    id: 13, slug: "underpowered-tests", title: "Underpowered tests", heading: "Small tests don’t just miss. Their winners exaggerate.", part: 3, minutes: 7, lab: "simulation",
    intro: "With few buyers and a small true gain, most Northstar tests will be inconclusive. The rare significant winners tend to be experiments where noise pushed the estimate unusually high.",
    points: [
      { title: "Low power misses useful effects.", text: "An insignificant result from a small test can coexist with a wide interval containing meaningful gains and harms. It does not establish equivalence." },
      { title: "Selection creates the winner’s curse.", text: "If you discuss only significant positive tests, you select estimates helped by positive noise. Their average lift can exceed the true effect even when the estimator is unbiased before selection." },
      { title: "Do not size the next test from the lucky winner.", text: "Plan using a worthwhile plausible effect, prior evidence, and uncertainty. Replication and shrinkage can help; repeatedly running small tests until one wins does not solve the problem." },
    ], takeaway: "A significant result from a noisy test may overstate the size of the win.",
    question: "Why are the rare significant winners in a low-power setting often too large?", choices: ["They are selected for favorable noise", "Significance removes all sampling error", "Every small experiment is invalid"], correct: 0,
    answer: "Conditioning on significance preferentially retains estimates that noise pushed away from zero. This is selection bias, not proof that every individual winner is false.",
  },
  {
    id: 14, slug: "peeking-and-stopping", title: "Peeking & stopping", heading: "A daily look is not a daily permission to stop.", part: 3, minutes: 7, lab: "peeking",
    intro: "The team refreshes the dashboard every morning and wants to ship the first day p < 0.05. Repeatedly applying a fixed-horizon rule changes its false-positive rate.",
    points: [
      { title: "Observation and optional stopping differ.", text: "Watching operational safety is sensible. Repeatedly making efficacy decisions with ordinary fixed-horizon p-values is a different test from the one you planned." },
      { title: "Prespecify the analysis horizon.", text: "For a fixed-horizon design, finish the sample, duration, and outcome maturation rules before making the final efficacy decision. Do not extend only the disappointing tests." },
      { title: "Sequential designs exist.", text: "Group-sequential boundaries, alpha spending, and always-valid methods permit suitable monitoring when used correctly. Do not retrofit a convenient sequential rule after seeing the path." },
    ], takeaway: "Choose a stopping rule whose statistical guarantees match how you actually stop.",
    question: "Can you repeatedly use ordinary 5% tests and stop at the first win while retaining 5% Type I error?", choices: ["Yes, each look is 5%", "No; use a prespecified horizon or valid sequential method", "Yes, if you only check on weekdays"], correct: 1,
    answer: "The chance of at least one false alarm grows across opportunities. Correlated cumulative looks need a sequential design; the independent-tests illustration is not their exact error rate.",
  },
  {
    id: 15, slug: "winsorization", title: "Heavy tails & capping", heading: "Cap the extremes, keep the people—and change the question.", part: 3, minutes: 7, lab: "variance",
    intro: "Revenue per buyer is dominated by a few very large baskets. Winsorizing revenue at a predeclared cap keeps every buyer but changes the metric to capped revenue per buyer.",
    points: [
      { title: "Capping is not deletion.", text: "Replace values above a cap with the cap; do not remove the buyers. A genuine high spender is not a data error merely because the value is inconvenient." },
      { title: "The estimand changes.", text: "Lower variance is useful, but the effect on capped revenue is not the effect on total revenue. A treatment that helps large buyers can lose much of its real benefit after capping." },
      { title: "Choose the cap without fishing.", text: "Use historical data or an otherwise valid predeclared method and apply the same cap in both arms. Report uncapped revenue alongside it, and never tune caps until the result becomes significant." },
    ], takeaway: "Variance reduction is not free when it changes the outcome you are estimating.",
    question: "A capped revenue win directly proves what?", choices: ["An equal-sized win in total revenue", "That high spenders were mistakes", "A win on the capped metric, not necessarily total revenue"], correct: 2,
    answer: "Capping changes the outcome. Its lift need not equal the lift in uncapped revenue or profit.",
  },
  {
    id: 16, slug: "cuped", title: "CUPED", heading: "Use the past to remove noise, not to leak the future.", part: 3, minutes: 8, lab: "cuped",
    intro: "Buyers who spent more before the test often spend more during it. CUPED uses a pre-treatment covariate to adjust away predictable outcome variation while targeting the same mean treatment effect under appropriate assumptions.",
    points: [
      { title: "Adjust, do not select.", text: "A centered adjustment Yadj = Y − θ(X − mean X) can reduce noise when X predicts Y. In a randomized test, pre-treatment X has equal expectation across arms, preserving the treatment contrast in expectation." },
      { title: "Correlation determines the ideal gain.", text: "For one covariate and an optimal linear coefficient, ideal residual variance is Var(Y) × (1 − ρ²). Correlation 0.6 gives 64% of the original variance, not 40%. Real gains need estimation and validation." },
      { title: "Keep covariates genuinely pre-treatment.", text: "During-test latency or spend can be affected by treatment and is not a safe pre-treatment covariate. Handle new buyers with no history explicitly and avoid fitting procedures that invalidate standard errors." },
    ], formula: "Yadj = Y − θ(X − mean X)\nideal residual variance / original variance = 1 − ρ²", takeaway: "Good pre-treatment predictors improve precision without redefining the business outcome.",
    question: "Which is a suitable candidate covariate?", choices: ["Buyer spend in the month before assignment", "Latency after treatment exposure", "Whether the buyer purchased during the experiment"], correct: 0,
    answer: "Historical spend predates treatment. During-test outcomes can be mediators or otherwise treatment-affected and would risk biasing the contrast.",
  },
  {
    id: 17, slug: "triggering-and-dilution", title: "Triggering & dilution", heading: "An effect on one page can disappear in the whole store.", part: 4, minutes: 7, lab: "triggering",
    intro: "Only some eligible buyers reach a product page served by the changed path. A large local gain can become a small storewide effect. That dilution is real for the broad policy question.",
    points: [
      { title: "Population defines the effect.", text: "The all-assigned estimate asks what happens when we enable the policy for eligible buyers. A safely triggered estimate asks what happens among buyers who would encounter the affected path." },
      { title: "Trigger symmetrically.", text: "Instrument a counterfactual eligibility event in both groups before the treatment changes behavior. ‘Used the new cache’ is not available in control and can depend on whether treatment succeeded." },
      { title: "A scaling shortcut needs assumptions.", text: "Overall effect ≈ affected share × local effect only when unaffected buyers have zero effect, selection is stable, and the effect measure is compatible. Interference and treatment-dependent triggering can break it." },
    ], takeaway: "Choose a population for a reason; never filter just to magnify the lift.",
    question: "Which trigger is most defensible?", choices: ["Successfully loaded the treatment page", "A counterfactual eligibility rule measured the same way in both arms", "Made a purchase after seeing treatment"], correct: 1,
    answer: "A symmetric, treatment-independent eligibility rule preserves comparability. Success and purchase are treatment-affected outcomes.",
  },
  {
    id: 18, slug: "ratio-metrics", title: "Ratio metrics", heading: "More orders can make revenue per order fall.", part: 4, minutes: 7, lab: "ratio",
    intro: "Faster pages may encourage extra small purchases. Revenue per order could fall while revenue per buyer rises. Ratios can hide changes in their own denominators.",
    points: [
      { title: "Ratio of totals is not mean of ratios.", text: "Total revenue / total orders weights frequent orderers differently from an average of buyer-level revenue/order ratios. Buyers with no orders also make the latter undefined." },
      { title: "Show numerator and denominator.", text: "Report revenue, orders, and assigned buyers together. Revenue per buyer includes zero-purchase buyers and targets a different business quantity from average order value." },
      { title: "Inference must preserve covariance.", text: "Use a suitable delta-method or buyer-cluster bootstrap analysis for a ratio of totals. Treating the denominator as fixed or requests as independent can misstate uncertainty." },
    ], takeaway: "A ratio can move because either side changed; inspect both.",
    question: "Average order value falls while revenue per buyer rises. Is that impossible?", choices: ["Yes, the metrics must agree", "Yes, if assignment is random", "No, buyers can place more smaller orders"], correct: 2,
    answer: "More orders per buyer can outweigh a lower value per order. These metrics answer different questions.",
  },
  {
    id: 19, slug: "multiple-testing", title: "Multiple comparisons", heading: "Enough scorecards will eventually find a winner.", part: 4, minutes: 6, lab: "multiplicity",
    intro: "The dashboard has conversion, revenue, latency, 20 countries, and 10 device groups. Searching them all for any p < 0.05 creates more opportunities for a false discovery.",
    points: [
      { title: "Define the family of claims.", text: "One predeclared primary outcome prevents a post-hoc metric beauty contest. Multiple variants, co-primary metrics, and confirmatory subgroup claims may still need multiplicity control." },
      { title: "Match the correction to the objective.", text: "Holm or Bonferroni can control family-wise error. False discovery rate procedures target a different error criterion. Neither makes a statistically tiny effect economically valuable." },
      { title: "Label exploration honestly.", text: "A surprising device segment can generate a hypothesis. It is not automatically a confirmed win. Replicate or test the interaction with an appropriate analysis and correction." },
    ], takeaway: "Declare confirmatory claims before the search; treat the rest as exploration.",
    question: "Does one significant segment prove the treatment works differently there?", choices: ["No; assess an interaction and account for the search", "Yes, if another segment is not significant", "Yes, any p-value below 0.05 is conclusive"], correct: 0,
    answer: "A significant effect in one segment and an insignificant one in another is not itself a significant difference between effects.",
  },
  {
    id: 20, slug: "shared-infrastructure", title: "Shared infrastructure", heading: "Your control group may be using the same queue.", part: 4, minutes: 8, lab: "interference",
    intro: "The new cache reduces load on a database shared with control. Control pages also get faster. The buyer-level contrast may understate what would happen if the whole store moved to the new stack.",
    points: [
      { title: "Interference breaks isolation.", text: "A buyer’s outcome can depend on other buyers’ assignments through shared queues, cache warming, inventory, sellers, or capacity. The standard no-interference assumption no longer holds." },
      { title: "Pick a design for the mechanism.", text: "Isolated comparable infrastructure pools can help. Randomizing regions or clusters requires enough independent clusters and cluster-aware inference. A single treated region versus one control region is weak evidence." },
      { title: "Switchbacks need washout.", text: "Alternating treatment over randomized time blocks can target shared systems, but cache state, time-of-day demand, and carryover matter. Randomize blocks, allow washout, and account for temporal dependence." },
    ], takeaway: "For an infra change, experiment design must include the resource topology.",
    question: "Treatment reduces a queue shared with control. What should you question?", choices: ["Whether the logo is correct", "Whether buyer randomization isolates the rollout effect", "Whether randomization ever works"], correct: 1,
    answer: "Shared resources create spillovers. Reconsider the estimand and the unit/design, rather than interpreting the buyer contrast as the universal full-rollout effect.",
  },
  {
    id: 21, slug: "segments-and-novelty", title: "Segments & time", heading: "A first-day win may not survive a full week.", part: 5, minutes: 7, lab: "segments",
    intro: "Mobile buyers on slow networks may benefit most. Cache warmup can also make day one unlike day seven. Northstar must separate genuine heterogeneity from noisy slices and changing conditions.",
    points: [
      { title: "Segment on pre-treatment attributes.", text: "Device class or region defined before exposure is safer than ‘buyers who purchased twice during the test’. Prespecify important segments and distinguish exploratory views from confirmatory claims." },
      { title: "Test differences, not significance labels.", text: "A significant mobile result and an insignificant desktop result do not prove different effects. Examine a treatment-by-segment interaction and its uncertainty, with appropriate multiplicity handling." },
      { title: "Allow the system and outcomes to settle.", text: "Warmup, novelty, day-of-week mix, and delayed conversions affect interpretation. Predefine windows and maturation; do not delete inconvenient early days after seeing them." },
    ], takeaway: "Use segments and time plots to diagnose—not to shop for a favorable story.",
    question: "Mobile is significant; desktop is not. Does that establish an interaction?", choices: ["No, directly assess the difference in treatment effects", "Yes, by definition", "Only if mobile has more requests"], correct: 0,
    answer: "The difference between significant and not significant is not necessarily statistically significant. Test the interaction itself.",
  },
  {
    id: 22, slug: "safe-rollouts", title: "Safe ramps & load", heading: "A 1% test is not a 100% load test.", part: 5, minutes: 7, lab: "rollout",
    intro: "A tiny canary checks basic safety, but a cache that works at 1% can fail at full traffic. Warmup, contention, and capacity can make treatment effects depend on saturation.",
    points: [
      { title: "Ramp to protect buyers.", text: "Start with a small safety canary, monitor correctness and severe incidents, then increase under predeclared checks. Rollback should be operationally tested before exposure." },
      { title: "Keep cohorts and phases interpretable.", text: "Changing allocation, configuration, and system state can change the target effect. Log phase boundaries and use an analysis appropriate for the ramp rather than pooling every phase blindly." },
      { title: "Combine different kinds of evidence.", text: "An A/B informs buyer impact at the tested saturation. Load tests, fault injection, capacity models, and staged rollouts address operational limits. None is a substitute for the others." },
    ], takeaway: "Validate behavior under the operating conditions you intend to ship.",
    question: "A canary succeeds at 1% traffic. What is still unknown?", choices: ["Nothing; immediately ship to everyone", "Only the p-value color", "Full-load behavior and a sufficiently precise buyer effect"], correct: 2,
    answer: "A small canary may be underpowered and cannot reveal every saturation-dependent failure. Continue a safe, measured ramp with the right evidence.",
  },
  {
    id: 23, slug: "ship-hold-or-stop", title: "Ship, hold, or stop", heading: "Make a decision, not just a significance announcement.", part: 5, minutes: 8, lab: "decision",
    intro: "The experiment ends. The team needs a decision that combines buyer impact, practical value, reliability, costs, and remaining uncertainty—not just one green number.",
    points: [
      { title: "Read the whole scorecard.", text: "First establish trustworthy assignment and mature outcomes. Then inspect the primary effect and interval, mechanism metrics, guardrail bounds, costs, and known limitations." },
      { title: "Separate superiority from non-inferiority.", text: "A cost-saving migration may be worthwhile if buyer impact is demonstrably above a predeclared acceptable-loss margin. That is a different decision rule from proving conversion uplift; do not switch objectives after a null result." },
      { title: "Hold is an honest outcome.", text: "If the interval still allows important harm, a safety bound fails, or interference makes the target unclear, hold or redesign. More data helps sampling uncertainty, not broken logging or an inappropriate design." },
    ], takeaway: "Ship against a predeclared objective with credible evidence and operational safeguards.",
    question: "Conversion is inconclusive, but costs fall. Can you invent a non-inferiority margin now?", choices: ["Yes, any margin justifies the win", "No; that would change the decision rule after seeing evidence", "Only if latency is significant"], correct: 1,
    answer: "A cost-saving non-inferiority design is legitimate when planned appropriately. Choosing its margin from the observed result undermines the intended guarantees.",
  },
  {
    id: 24, slug: "experimentation-workflow", title: "An experimentation workflow", heading: "From an infrastructure idea to trustworthy evidence.", part: 5, minutes: 8, lab: "workflow",
    intro: "Bring the journey together: Northstar is evaluating a new product-page cache. The goal is not to ‘get a significant result’. It is to learn whether the change is worth rolling out safely.",
    points: [
      { title: "Design before exposure.", text: "State the causal question and population. Map shared resources. Choose sticky assignment, a seven-day conversion outcome, latency diagnostics, guardrail margins, a planning effect, sample size, and a stopping rule." },
      { title: "Validate and run deliberately.", text: "Check A/A behavior and instrumentation. Launch a monitored canary, ramp safely, audit SRM and missing outcomes, and retain everyone in the intended analysis population. Do not stop opportunistically for efficacy." },
      { title: "Analyze, decide, and remember.", text: "Wait for mature outcomes. Estimate effects and uncertainty with the correct unit and metric. Apply the declared decision rule, document limitations, roll out with monitoring, and preserve what the experiment taught." },
    ], takeaway: "Question → design → validate → run → estimate → decide → monitor.",
    question: "The primary metric wins, but assignment logs are missing disproportionately in treatment. What next?", choices: ["Ship the statistical winner", "Ignore missing buyers", "Investigate validity before making a causal claim"], correct: 2,
    answer: "A precise estimate from a biased sample is not trustworthy evidence. Resolve measurement and selection issues before interpreting the lift.",
  },
];

export const experimentUrl = (lesson: ExperimentLesson) => `/experimentation/${lesson.slug}`;
