"use client";

import { useState } from "react";
import type { ExperimentLesson } from "@/lib/experimentation";
import { approximatePower, conversionComparison, normalCdf, plannedPerArm, quantile, simulateEstimates, summarize } from "@/lib/experiment-math";
import { Chart } from "./chart";

const purple = "#7151b1", teal = "#397c73", red = "#ad4b43";
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const pp = (n: number) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)} pp`;
function Slider({ label, value, min, max, step = 1, onChange, suffix = "" }: { label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void; suffix?: string }) {
  return <label className="slider-control"><span>{label}<strong>{fmt(value)}{suffix}</strong></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}
function Stats({ items }: { items: [string, string][] }) { return <div className="lab-stats">{items.map(([label, value]) => <div key={label}><span className="micro">{label}</span><strong>{value}</strong></div>)}</div>; }
function Hint({ children }: { children: React.ReactNode }) { return <p className="lab-hint">{children}</p>; }
function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) { return <button className={`toggle ${on ? "on" : ""}`} aria-pressed={on} onClick={onClick}><span />{children}</button>; }

function Assignment() {
  const [random, setRandom] = useState(false), [sticky, setSticky] = useState(true);
  return <><div className="lab-controls"><Toggle on={random} onClick={() => setRandom(!random)}>Random assignment</Toggle><Toggle on={sticky} onClick={() => setSticky(!sticky)}>Sticky buyer assignment</Toggle></div>
    <div className="assignment-grid">{["Control · existing stack", "Treatment · new cache"].map((label, arm) => {
      const premium = random ? 50 : arm ? 80 : 20;
      return <div key={label}><span className="micro">{label}</span><div className="buyer-dots" aria-label={`${premium}% premium buyers`}>{Array.from({ length: 20 }, (_, i) => <i key={i} className={i < premium / 5 ? "premium" : ""} />)}</div><strong>{premium}% premium</strong><p>Expected conversion: {(premium / 100 * 20 + (1 - premium / 100) * 5).toFixed(1)}%</p></div>;
    })}</div>
    <Stats items={[["True within-type treatment effect", "0.00 pp"], ["Apparent lift from buyer mix", random ? "0.00 pp" : "+9.00 pp"], ["One buyer’s next 4 requests", sticky ? "A → A → A → A" : "A → B → A → B"]]} />
    <Hint>Premium buyers have 20% conversion; other buyers have 5%, on either stack. Randomization shows equal mixes in expectation here, not guaranteed finite-sample balance. Dot colors show buyer types. Sticky routing keeps one buyer on one experience; repeated requests remain correlated.</Hint></>;
}

function Conversion({ inference = false }: { inference?: boolean }) {
  const [n, setN] = useState(20000), [lift, setLift] = useState(20);
  const control = Math.round(n * 0.1), treatment = Math.round(n * (0.1 + lift / 10000));
  const result = conversionComparison(n, control, treatment);
  const extent = Math.max(Math.abs(result.low), Math.abs(result.high), 0.003) * 1.25;
  const x = (value: number) => 300 + value / extent * 250;
  return <><div className="lab-controls"><Slider label="Buyers per arm" value={n} min={1000} max={200000} step={1000} onChange={setN} /><Slider label="Observed lift (basis points)" value={lift} min={-50} max={100} step={5} onChange={setLift} /></div>
    <div className="experiment-scoreboard"><div><span>CONTROL</span><strong>{(result.control * 100).toFixed(2)}%</strong><small>{fmt(control)} / {fmt(n)} buyers</small></div><div><span>TREATMENT</span><strong>{(result.treatment * 100).toFixed(2)}%</strong><small>{fmt(treatment)} / {fmt(n)} buyers</small></div></div>
    <svg viewBox="0 0 600 120" className="experiment-plot" role="img" aria-label="Estimated absolute conversion lift and approximate 95% confidence interval"><line x1="50" x2="550" y1="60" y2="60" stroke="#aaa995" /><line x1="300" x2="300" y1="15" y2="85" stroke="#7a786a" strokeDasharray="4 4" /><line x1={x(result.low)} x2={x(result.high)} y1="50" y2="50" stroke={purple} strokeWidth="5" /><circle cx={x(result.lift)} cy="50" r="7" fill={purple} /><text x="300" y="108" textAnchor="middle">zero effect · {pp(result.low)} to {pp(result.high)}</text></svg>
    <Stats items={[["Absolute lift", pp(result.lift)], ["Relative lift", `${(result.relative * 100).toFixed(2)}%`], ["Two-sided p-value", result.p < 0.0001 ? "< 0.0001" : result.p.toFixed(4)]]} />
    <Hint>{inference ? "Hold the observed lift fixed and increase the sample. The interval narrows and the null becomes less compatible with the estimate. This is a sensitivity demonstration, not a sequence of accumulating real outcomes." : "20 basis points = 0.20 percentage points = 2% relative lift from a 10% baseline. Change the sample without changing the displayed rates: precision, not the unit conversion, changes."} Interval: unpooled Wald normal approximation; p-value: pooled two-proportion z-test. Independent buyers, mature outcomes, one fixed-horizon analysis; not for sparse or clustered data.</Hint></>;
}

function Latency() {
  const [saving, setSaving] = useState(100), [tail, setTail] = useState(600);
  const control = Array.from({ length: 100 }, (_, i) => 230 + i * 3 + (i >= 90 ? (i - 89) * 65 : 0));
  const treatment = control.map((v, i) => Math.max(30, v - saving + (i >= 94 ? tail : 0)));
  return <><div className="lab-controls"><Slider label="Typical latency reduction" value={saving} min={0} max={200} step={10} onChange={setSaving} suffix=" ms" /><Slider label="Slow-request penalty" value={tail} min={0} max={1500} step={50} onChange={setTail} suffix=" ms" /></div>
    <Chart money={false} title="Sorted request latency in milliseconds" series={[{ name: "Control · ms", values: control, color: teal }, { name: "Treatment · ms", values: treatment, color: purple }]} labels={[{ at: 0, text: "Fastest" }, { at: 49, text: "Median" }, { at: 94, text: "p95" }]} />
    <Stats items={[["Mean change", `${(summarize(treatment).mean - summarize(control).mean).toFixed(0)} ms`], ["Median change", `${quantile(treatment, 0.5) - quantile(control, 0.5)} ms`], ["p95 change", `${quantile(treatment, 0.95) - quantile(control, 0.95)} ms`]]} />
    <Hint>Each line is 100 constructed requests sorted by latency, not time. Increase the tail penalty: most requests improve while the slowest deteriorate. Quantiles use the nearest-rank rule. No quantile confidence interval is estimated here; real inference must account for repeated requests per buyer and failures.</Hint></>;
}

function Guardrails() {
  const [increase, setIncrease] = useState(5), [precision, setPrecision] = useState(10);
  const upper = increase + 1.645 * precision;
  return <><div className="lab-controls"><Slider label="Error-rate change (basis points)" value={increase} min={-20} max={30} onChange={setIncrease} /><Slider label="Standard error (basis points)" value={precision} min={1} max={20} onChange={setPrecision} /></div>
    <div className={`experiment-verdict ${upper < 10 ? "safe" : "caution"}`}><span className="micro">ERROR GUARDRAIL · LOWER IS BETTER</span><h3>{upper < 10 ? "Bound is below the harm margin" : "Unacceptable harm is not ruled out"}</h3><p>One-sided 95% upper bound: {upper.toFixed(1)} bp. Predeclared acceptable increase: 10 bp (0.10 pp).</p></div>
    <Stats items={[["Observed increase", `${increase} bp`], ["Upper confidence bound", `${upper.toFixed(1)} bp`], ["Prespecified margin", "10 bp"]]} />
    <Hint>Reduce the standard error while keeping the observed error increase fixed. A small, uncertain harm estimate is not evidence of safety. This is a normal-approximation bound with supplied estimates, for one predeclared guardrail; multiple guardrails and critical incidents require an appropriate policy.</Hint></>;
}

function Srm() {
  const [treatment, setTreatment] = useState(5100);
  const total = 10000, z = (treatment - total / 2) / Math.sqrt(total * 0.25);
  const p = Math.min(1, 2 * normalCdf(-Math.abs(z)));
  return <><Slider label="Assigned treatment buyers" value={treatment} min={4500} max={5500} step={10} onChange={setTreatment} />
    <div className="allocation-bar"><div style={{ width: `${100 - treatment / 100}%` }}>A · {fmt(total - treatment)}</div><div style={{ width: `${treatment / 100}%` }}>B · {fmt(treatment)}</div></div>
    <Stats items={[["Expected allocation", "50 / 50"], ["SRM p-value (approx.)", p < 0.00001 ? "< 0.00001" : p.toFixed(5)], ["Example alarm at p < 0.001", p < 0.001 ? "Investigate" : "No alarm"]]} />
    <Hint>With 10,000 independent assignments, small differences happen by chance. This two-sided normal approximation is equivalent to a one-degree-of-freedom chi-square large-sample test. The alarm threshold is illustrative, not a universal rule. No alarm does not certify the pipeline.</Hint></>;
}

function Power() {
  const [relative, setRelative] = useState(2), [traffic, setTraffic] = useState(20000), [n, setN] = useState(50000);
  const effect = 0.1 * relative / 100, required = plannedPerArm(0.1, effect);
  return <><div className="lab-controls"><Slider label="Relative MDE" value={relative} min={1} max={10} onChange={setRelative} suffix="%" /><Slider label="New eligible buyers per day (total)" value={traffic} min={1000} max={100000} step={1000} onChange={setTraffic} /><Slider label="Available buyers per arm" value={n} min={1000} max={500000} step={1000} onChange={setN} /></div>
    <div className="power-meter"><div style={{ width: `${approximatePower(0.1, effect, n) * 100}%` }} /><span>Power at available sample: {(approximatePower(0.1, effect, n) * 100).toFixed(1)}%</span></div>
    <Stats items={[["Absolute planning effect", pp(effect)], ["Required per arm · 80% power", fmt(required)], ["Minimum collection + follow-up", `${Math.ceil(2 * required / traffic)} + 7 days`]]} />
    <Hint>Approximate two-sided 5% normal test, 10% baseline, equal allocation, independent binary buyer outcomes. The traffic count is unique newly eligible buyers across both arms, not daily active users counted repeatedly. Add full business cycles, warmup, and operational constraints; this is not a universal sample-size calculator.</Hint></>;
}

function Simulation() {
  const [n, setN] = useState(1000), [effect, setEffect] = useState(100), [seed, setSeed] = useState(42), [onlyWinners, setOnlyWinners] = useState(false), [showIntervals, setShowIntervals] = useState(false);
  const trials = simulateEstimates(n, effect / 10000, seed);
  const significant = trials.filter(t => t.significant), positive = trials.filter(t => t.low > 0), wrongSign = effect > 0 ? trials.filter(t => t.high < 0) : [];
  const meanSignificant = significant.length ? significant.reduce((sum, t) => sum + t.estimate, 0) / significant.length : null;
  const exaggeration = significant.length && effect ? significant.reduce((sum, t) => sum + Math.abs(t.estimate), 0) / significant.length / (effect / 10000) : null;
  const cutoff = 1.96 * Math.sqrt(2 * .1 * .9 / n);
  const values = trials.flatMap(t => showIntervals ? [t.low, t.high] : [t.estimate]);
  const tick = .02, lower = Math.min(-tick, Math.floor(Math.min(...values, -cutoff) / tick) * tick), upper = Math.max(tick, Math.ceil(Math.max(...values, cutoff) / tick) * tick);
  // Transcendental math can differ by a few ulps between Node and browser engines.
  // Round SVG coordinates so identical seeded data hydrate identically.
  const y = (v: number) => (285 - (v - lower) / (upper - lower) * 240).toFixed(3);
  const x = (i: number) => (58 + i / 299 * 660).toFixed(3);
  const ticks = Array.from({ length: Math.round((upper - lower) / tick) + 1 }, (_, i) => lower + i * tick);
  return <><div className="lab-controls simulation-primary-controls"><Slider label="Buyers per arm" value={n} min={1000} max={100000} step={1000} onChange={setN} /><button className="button secondary" onClick={() => setSeed(s => s + 1)}>Run 300 new trials</button></div>
    <svg viewBox="0 0 760 325" className="simulation-chart" role="img" aria-label="300 simulated treatment estimates, significance region, and true effect">
      <title>Each dot is one independent simulated A/B test; green is significant positive, red is significant negative, gray is not significant.</title>
      <text x="58" y="17">ESTIMATED EFFECT (PERCENTAGE POINTS)</text>
      <rect x="58" width="660" y={y(cutoff)} height={Number(y(-cutoff)) - Number(y(cutoff))} fill="#d9d7cb" />
      {ticks.map((v, i) => <g key={i}><line x1="58" x2="718" y1={y(v)} y2={y(v)} stroke={Math.abs(v) < 1e-9 ? "#65645a" : "#d1cec0"} /><text x="48" y={Number(y(v)) + 4} textAnchor="end">{v > 0 ? "+" : ""}{(v * 100).toFixed(1)}</text></g>)}
      <text x="66" y={Number(y(cutoff)) + 14}>Not significant</text>
      <line x1="58" x2="718" y1={y(effect / 10000)} y2={y(effect / 10000)} stroke={teal} strokeWidth="1.8" />
      <text className="plot-annotation" x="712" y={Number(y(effect / 10000)) - 7} textAnchor="end">True effect {pp(effect / 10000)}</text>
      {meanSignificant !== null && <g><line x1="58" x2="718" y1={y(meanSignificant)} y2={y(meanSignificant)} stroke={teal} strokeDasharray="5 4" /><text className="plot-annotation" x="712" y={Math.min(Number(y(meanSignificant)) - 7, Number(y(effect / 10000)) - 25)} textAnchor="end">Average significant estimate {pp(meanSignificant)}</text></g>}
      {trials.map((t, i) => <g key={i} opacity={onlyWinners && t.low <= 0 ? .12 : .85}>{showIntervals && <line x1={x(i)} x2={x(i)} y1={y(t.low)} y2={y(t.high)} stroke="#aaa798" strokeWidth=".6" />}<circle cx={x(i)} cy={y(t.estimate)} r="2.5" fill={t.low > 0 ? teal : t.high < 0 ? red : "#929184"} /></g>)}
      <line x1="58" x2="718" y1="300" y2="300" stroke="#7b796b" /><text x="718" y="317" textAnchor="end">300 INDEPENDENT RUNS OF THE SAME TEST</text>
    </svg>
    <div className="simulation-legend"><span><i style={{ background: teal }} />Significant, positive</span><span><i style={{ background: red }} />Significant, negative{effect > 0 ? " (wrong sign)" : ""}</span><span><i style={{ background: "#929184" }} />Not significant</span></div>
    <Stats items={[["Theoretical power", `${(approximatePower(.1, effect / 10000, n) * 100).toFixed(1)}%`], ["Significant runs", `${significant.length} of 300`], ["Exaggeration of significant results", exaggeration !== null ? `${exaggeration.toFixed(1)}×` : "— (null effect)"], [effect > 0 ? "Significant with the wrong sign" : "Positive false alarms", String(effect > 0 ? wrongSign.length : positive.length)]]} />
    <details className="simulation-options"><summary>Simulation options</summary><div><Slider label="True lift (basis points)" value={effect} min={0} max={100} step={5} onChange={setEffect} /><Toggle on={showIntervals} onClick={() => setShowIntervals(!showIntervals)}>Show 95% intervals</Toggle><Toggle on={onlyWinners} onClick={() => setOnlyWinners(!onlyWinners)}>Highlight positive winners</Toggle></div></details>
    <Hint>Exaggeration = mean absolute significant estimate ÷ true effect. In Simulation options, set truth to zero to explore false alarms. Theoretical power and shading use a two-sided 5% known-variance Gaussian approximation at a fixed 10% baseline—not exact binomial inference. Independent runs, not cumulative peeks; seeds are reproducible.</Hint></>;
}

function Peeking() {
  const [looks, setLooks] = useState(10);
  return <><Slider label="Independent testing opportunities" value={looks} min={1} max={50} onChange={setLooks} />
    <div className="power-meter caution"><div style={{ width: `${(1 - 0.95 ** looks) * 100}%` }} /><span>At least one false alarm: {((1 - 0.95 ** looks) * 100).toFixed(1)}%</span></div>
    <Stats items={[["One valid null test", "5%"], ["Independent opportunities", String(looks)], ["Any false alarm", `${((1 - 0.95 ** looks) * 100).toFixed(1)}%`]]} />
    <Hint>This is the exact family-wise error calculation for independent 5% null tests: 1 − 0.95^k. Repeated looks at a cumulative experiment are correlated, so this is NOT their exact false-positive rate. It illustrates the extra-opportunities problem, not a sequential-testing boundary. Use fixed-horizon analysis or a properly designed sequential method.</Hint></>;
}

function Variance() {
  const [cap, setCap] = useState(200);
  const control = Array.from({ length: 200 }, (_, i) => i < 140 ? 0 : i < 196 ? 20 + (i % 10) * 12 : 1000 + (i - 196) * 500);
  const treatment = control.map((v, i) => v * (i >= 196 ? 1.2 : 1.02));
  const a = summarize(control.map(v => Math.min(v, cap))), b = summarize(treatment.map(v => Math.min(v, cap)));
  return <><Slider label="Revenue cap per buyer" value={cap} min={50} max={3000} step={50} onChange={setCap} suffix=" dollars" />
    <Chart series={[{ name: "Uncapped treatment revenue", values: treatment, color: "#b5ac96" }, { name: "Capped treatment revenue", values: treatment.map(v => Math.min(v, cap)), color: purple }]} labels={[{ at: 0, text: "Buyer 1" }, { at: 199, text: "Buyer 200" }]} />
    <Stats items={[["Uncapped mean effect", `$${(summarize(treatment).mean - summarize(control).mean).toFixed(2)}`], ["Capped mean effect", `$${(b.mean - a.mean).toFixed(2)}`], ["Capped control mean SE", `$${a.se.toFixed(2)}`], ["Buyers retained per arm", "200 / 200"]]} />
    <Hint>Constructed matched revenue profiles, not randomized observations or an inferential A/B score. Large buyers receive a larger constructed benefit. Lower the cap: the descriptive mean standard error falls, but much of the real uncapped benefit disappears. No treatment confidence interval is claimed.</Hint></>;
}

function Cuped() {
  const [rho, setRho] = useState(60);
  const residual = 1 - (rho / 100) ** 2;
  return <><Slider label="Pre-period correlation" value={rho} min={0} max={95} step={5} onChange={setRho} suffix="%" />
    <div className="comparison-bars"><div><span>Raw</span><i style={{ width: "60%", background: "#b9af97" }} /><strong>100%</strong></div><div><span>Adjusted</span><i style={{ width: `${60 * residual}%`, background: purple }} /><strong>{(100 * residual).toFixed(1)}%</strong></div></div>
    <Stats items={[["Ideal variance remaining", `${(100 * residual).toFixed(1)}%`], ["Standard error remaining", `${(100 * Math.sqrt(residual)).toFixed(1)}%`], ["Equivalent sample multiplier", `${(1 / residual).toFixed(2)}×`]]} />
    <Hint>Theoretical single-covariate optimal linear adjustment: variance multiplier 1 − ρ². No coefficient is fitted here, and the sample multiplier is an idealized precision equivalence, not new buyers. Covariates must precede treatment; validate estimation, missing-history handling, and uncertainty on real data.</Hint></>;
}

function Triggering() {
  const [share, setShare] = useState(25), [failures, setFailures] = useState(false);
  const allRate = 0.102, retainedRate = Math.min(1, allRate / 0.9);
  return <><div className="lab-controls"><Slider label="Buyers affected by the path" value={share} min={5} max={100} step={5} onChange={setShare} suffix="%" /><Toggle on={failures} onClick={() => setFailures(!failures)}>Wrongly exclude failed loads</Toggle></div>
    <Stats items={[["Local absolute effect (supplied)", "+0.80 pp"], ["Expected all-buyer effect", pp(0.008 * share / 100)], ["Separate selection example", failures ? `${(retainedRate * 100).toFixed(2)}%` : "10.20%"], ["Selection-example denominator", failures ? "900 retained buyers" : "1,000 assigned buyers"]]} />
    <Hint>Left: dilution assumes a fixed, treatment-independent affected share and zero effect elsewhere. Right: a separate constructed treatment group has 102 purchasers among 1,000 assigned buyers. Dropping 100 failed-load non-purchasers falsely raises reported conversion to 102/900. These are two distinct illustrations, not one fitted model.</Hint></>;
}

function Ratio() {
  const [orders, setOrders] = useState(120), [aov, setAov] = useState(45);
  return <><div className="lab-controls"><Slider label="Treatment orders per 1,000 buyers" value={orders} min={80} max={200} step={5} onChange={setOrders} /><Slider label="Treatment average order value" value={aov} min={20} max={70} onChange={setAov} suffix=" dollars" /></div>
    <Stats items={[["Control · orders / AOV", "100 / $50"], ["Treatment · total revenue", `$${fmt(orders * aov)}`], ["AOV relative change", `${((aov / 50 - 1) * 100).toFixed(1)}%`], ["Revenue/buyer relative change", `${((orders * aov / 5000 - 1) * 100).toFixed(1)}%`]]} />
    <Hint>Both arms have 1,000 assigned buyers. Control revenue is $5,000. Increase treatment orders while lowering their average value: revenue per buyer and average order value can move in opposite directions. These aggregate totals do not provide the buyer-level covariance needed for a confidence interval.</Hint></>;
}

function Multiplicity() {
  const [tests, setTests] = useState(20);
  return <><Slider label="Null hypotheses searched" value={tests} min={1} max={100} onChange={setTests} />
    <Stats items={[["Unadjusted any-false-alarm risk", `${((1 - 0.95 ** tests) * 100).toFixed(1)}%`], ["Bonferroni per-test alpha", (0.05 / tests).toFixed(5)], ["Bonferroni family-wise bound", "≤ 5%"]]} />
    <Hint>Unadjusted risk assumes independent true-null tests; correlated dashboard metrics have a different joint rate. The Bonferroni bound applies regardless of dependence when individual tests are valid. This illustrates family-wise error, not false discovery rate or sequential monitoring.</Hint></>;
}

function Interference() {
  const [spillover, setSpillover] = useState(50);
  const benefit = 100, controlBenefit = benefit * spillover / 100;
  return <><Slider label="Benefit spilling into control" value={spillover} min={0} max={100} step={5} onChange={setSpillover} suffix="%" />
    <div className="infra-diagram"><div>Buyer A<br /><strong>Existing stack</strong></div><div className="shared-pool">↘ Shared database / queue ↙<br /><strong>Less load helps both arms</strong></div><div>Buyer B<br /><strong>New cache</strong></div></div>
    <Stats items={[["Treatment improvement vs old world", "100 ms"], ["Control improvement from spillover", `${controlBenefit} ms`], ["Observed randomized contrast", `${benefit - controlBenefit} ms`]]} />
    <Hint>A supplied linear spillover schematic, not a queueing model or an estimate of full-rollout impact. Increase spillover: a beneficial system change can yield a small buyer-level contrast. Real saturation may be nonlinear; isolated pools, cluster designs, or randomized switchbacks need their own assumptions and inference.</Hint></>;
}

function Segments() {
  const [mobile, setMobile] = useState(50), [warmup, setWarmup] = useState(true);
  const values = Array.from({ length: 14 }, (_, day) => (warmup ? (1 - Math.exp(-(day + 1) / 3)) : 1) * (mobile / 100 * 0.6 + (1 - mobile / 100) * 0.1));
  return <><div className="lab-controls"><Slider label="Mobile share (both arms)" value={mobile} min={0} max={100} step={5} onChange={setMobile} suffix="%" /><Toggle on={warmup} onClick={() => setWarmup(!warmup)}>Cache warmup</Toggle></div>
    <Chart money={false} title="Constructed daily conversion lift in percentage points" series={[{ name: "Constructed daily absolute lift (pp)", values, color: purple }]} labels={[{ at: 0, text: "Day 1" }, { at: 6, text: "Day 7" }, { at: 13, text: "Day 14" }]} />
    <Stats items={[["Supplied mobile effect", "+0.60 pp"], ["Supplied desktop effect", "+0.10 pp"], ["Steady-state weighted effect", `+${(mobile / 100 * 0.6 + (1 - mobile / 100) * 0.1).toFixed(2)} pp`]]} />
    <Hint>True segment effects and a warmup curve are supplied, not estimated. Changing population mix changes the aggregate even if segment effects stay fixed. A real interaction needs uncertainty and multiplicity-aware testing; this smooth illustration contains no evidence that early days may be discarded.</Hint></>;
}

function Rollout() {
  const [traffic, setTraffic] = useState(10), [capacity, setCapacity] = useState(60);
  const pressure = Math.max(0, traffic - capacity), errors = 0.1 + pressure ** 2 / 100;
  return <><div className="lab-controls"><Slider label="Traffic on the new stack" value={traffic} min={1} max={100} onChange={setTraffic} suffix="%" /><Slider label="Illustrative capacity threshold" value={capacity} min={20} max={100} step={5} onChange={setCapacity} suffix="% traffic" /></div>
    <div className={`experiment-verdict ${pressure ? "caution" : "safe"}`}><span className="micro">SATURATION SCHEMATIC</span><h3>{pressure ? "Capacity pressure emerges" : "Below the supplied threshold"}</h3><p>Constructed error rate: {errors.toFixed(2)}%. Small-scale success does not predict the whole curve.</p></div>
    <Hint>This deliberately simple nonlinear load illustration is not a capacity forecast. Ramps require measured saturation, rollback capability, phase-aware analysis, and safety monitoring. Do not interpret the supplied threshold as an engineering recommendation.</Hint></>;
}

function Decision() {
  const [scenario, setScenario] = useState("uncertain");
  const cases: Record<string, [string, string, string]> = {
    uncertain: ["−0.15 to +0.55 pp", "Harm bound exceeds margin", "Hold: both buyer impact and safety need resolution. More buyers help precision, not a broken design."],
    win: ["+0.22 to +0.48 pp", "Harm bounds below margins", "Candidate to ship under a predeclared conversion-superiority objective, after checking practical value, validity, costs, and capacity."],
    savings: ["−0.04 to +0.08 pp", "Harm bounds below margins", "Potential migration win only under a predeclared cost-saving, conversion non-inferiority objective. The supplied lower bound exceeds a −0.10 pp acceptable-loss margin; costs are assumed 15% lower."],
    broken: ["+0.30 to +0.70 pp", "Severe sample-ratio mismatch", "Investigate: a narrow interval cannot rescue suspect assignment or missing-data selection."],
  };
  const result = cases[scenario];
  return <><label className="experiment-select">Choose a completed scorecard<select value={scenario} onChange={e => setScenario(e.target.value)}><option value="uncertain">Uncertain buyer effect and safety</option><option value="win">Credible buyer improvement</option><option value="savings">Lower costs, conversion preserved?</option><option value="broken">Great lift, broken validity</option></select></label>
    <Stats items={[["Supplied conversion interval", result[0]], ["Diagnostic / guardrail status", result[1]]]} /><div className="experiment-verdict"><span className="micro">DISCUSS THE DECISION</span><p>{result[2]}</p></div><Hint>Hypothetical completed scorecards, not fitted experiments. A real decision requires the originally specified tests, bounds, operational evidence, and business objective. No universal ‘ship if green’ rule is implemented.</Hint></>;
}

const stages = [
  ["Define the causal question", "Will assigning eligible logged-in buyers to the new cache improve seven-day purchase conversion? Distinguish buyer benefit from a cost-saving migration objective."],
  ["Map the system and design", "Identify shared queues and cache state. Choose sticky buyer buckets only if the contrast is meaningful; otherwise design isolated pools, clusters, or randomized switchbacks."],
  ["Predeclare the scorecard", "Primary: seven-day conversion. Mechanism: page latency and tail. Guardrails: errors, stale prices, checkout failures. Declare margins, metric definitions, multiplicity, and cost evaluation."],
  ["Plan sample and stopping", "Use distinct buyers and a worthwhile absolute effect. Plan power, business cycles, seven-day follow-up, and a fixed horizon or valid sequential procedure."],
  ["Validate and canary", "Reconcile assignment and outcomes, inspect A/A calibration, verify rollback, and launch a small safety canary. Investigate SRM and differential missingness."],
  ["Run and mature outcomes", "Ramp safely, track configuration and phase boundaries, preserve original assignment, monitor safety, and wait for outcome windows. Do not cherry-pick dates or stop at a lucky p-value."],
  ["Estimate and decide", "Use the right unit and metric-specific inference, report effect intervals, verify guardrail bounds, and apply the original objective. Label exploratory segments and unresolved interference."],
  ["Roll out and remember", "Validate full-load behavior, expand in stages, monitor guardrails, preserve a decision record, and revisit the result if the system or buyer population changes."],
];
function Workflow() {
  const [open, setOpen] = useState(0);
  return <ol className="workflow-flow experiment-workflow">{stages.map(([title, text], i) => <li key={title}><h4 className="workflow-step-heading"><button id={`experiment-step-${i}`} aria-expanded={open === i} aria-controls={`experiment-detail-${i}`} className={open === i ? "selected" : ""} onClick={() => setOpen(i)}><span className="workflow-step-number">{i + 1}</span><strong>{title}</strong></button></h4><div id={`experiment-detail-${i}`} role="region" aria-labelledby={`experiment-step-${i}`} hidden={open !== i} className="workflow-step-detail"><p>{text}</p></div></li>)}</ol>;
}

export function ExperimentLab({ lesson }: { lesson: ExperimentLesson }) {
  const render = () => {
    switch (lesson.lab) {
      case "assignment": return <Assignment />;
      case "metrics": return <Conversion />;
      case "inference": return <Conversion inference />;
      case "latency": return <Latency />;
      case "guardrails": return <Guardrails />;
      case "srm": return <Srm />;
      case "power": return <Power />;
      case "simulation": return <Simulation />;
      case "peeking": return <Peeking />;
      case "variance": return <Variance />;
      case "cuped": return <Cuped />;
      case "triggering": return <Triggering />;
      case "ratio": return <Ratio />;
      case "multiplicity": return <Multiplicity />;
      case "interference": return <Interference />;
      case "segments": return <Segments />;
      case "rollout": return <Rollout />;
      case "decision": return <Decision />;
      case "workflow": return <Workflow />;
    }
  };
  return <section className="lab experiment-lab"><div className="lab-heading"><span className="figure-label">LAB {String(lesson.id).padStart(2, "0")}</span><h3>{lesson.title} · Northstar</h3></div>{render()}<div className="simulation-label">Constructed teaching example · not Amazon data or a production experimentation engine</div></section>;
}
