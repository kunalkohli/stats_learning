"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Info, RotateCcw } from "lucide-react";
import { Chart, AcfChart } from "./chart";
import { blackFriday, generateSales, metrics, money, movingAverage } from "@/lib/forecast";
import type { Lesson } from "@/lib/curriculum";
import { WorkflowLab } from "./workflow-lab";
import { MstlLab, ModelComparisonLab } from "./seasonal-model-labs";
import { HistoryForecastLab, RollingBacktestLab, AutocorrelationLab, ResidualNoiseLab, GrowthChoiceLab, ErrorMetricsLab, HierarchyReconciliationLab, DriverForecastLab, IntervalCoverageLab, FourierWavesLab, HoltWintersLab, DhrLab } from "./forecast-diagnostic-labs";
import { baselineForecast, type BaselineMethod } from "@/lib/forecast-playgrounds";

const ink = "#273d32", green = "#65845c", orange = "#c07a53", blue = "#728cae", purple = "#9a86ad";
const dates = [{ at: 0, text: "Jan ’23" }, { at: 181, text: "Jul ’23" }, { at: 365, text: "Jan ’24" }, { at: 547, text: "Jul ’24" }, { at: 731, text: "Jan ’25" }, { at: 912, text: "Jul ’25" }, { at: 1095, text: "Dec ’25" }];
const explainers: Partial<Record<Lesson["lab"], [string, string]>> = {
  range: ["Northstar's central forecast is surrounded by illustrative ranges. Move the horizon or hide the bands; hiding uncertainty does not remove it.", "Why is a single point estimate not enough for a planning decision?"],
  components: ["Change the ingredients of Northstar's simulated daily sales and compare the observed line with the supplied underlying components.", "Which changes persist, which repeat, and which are random or event-driven?"],
  decomposition: ["Compare a real centered weekly average with the simulator's known components, then include or omit the known event adjustment.", "What structure can remain when a weekly smoother misses an annual event?"],
  baseline: ["Each simple rule uses only Northstar's pre-origin history. Compare its forecast with the same 56 unseen days and compute genuine holdout errors.", "Does a more complex candidate earn its place against an honest baseline?"],
  smoothing: ["Move alpha to change the weight given to Northstar's latest observation. The level update is computed recursively; additional supplied trend illustrations are labeled separately.", "How does a faster reaction trade off against following noise?"],
  fourier: ["Combine repeating waves with supplied coefficients. The current diagram illustrates flexibility, rather than fitting a full DHR or Prophet model.", "What changes when a seasonal shape uses more harmonics?"],
  events: ["Align Northstar's Black Friday sales by the event date or the ordinary calendar date and compare where the peaks land.", "Why can a fixed-date annual slot misalign a moving holiday?"],
  families: ["Choose a model family to inspect which part of Northstar's forecasting problem its assumptions address.", "Which candidate is motivated by the pattern you need to explain?"],
  ar: ["This stationary AR(1) illustration shows lag memory and a conditional mean after a shock. It is not an automatic ARIMA/SARIMA fit.", "How does positive or negative short-run memory affect a forecast?"],
  stationary: ["Switch between Northstar's sales levels, daily changes, and same-weekday changes.", "Which transformation removes the changing level or repeating pattern, and what still remains?"],
  base: ["Keep this year's Northstar sales fixed and change the prior-year comparison value.", "Is the growth headline describing new demand or an unusually weak base?"],
  drivers: ["Inspect which candidate Northstar features were genuinely available before the forecast origin.", "Does this predictor cross the information boundary?"],
  plan: ["Keep Northstar's baseline expectation and target distinct while changing a supplied promotion-lift scenario.", "What is a forecast, what is an ambition, and what action might close the gap?"],
  workflow: ["Open one stage at a time and map a new Northstar forecasting problem to a decision, honest test, and targeted candidate.", "What evidence should determine the next step—not a mandatory complexity ladder?"],
  mstl: ["Follow the separate, forecast, project, and recombine stages using known simulator components.", "What does the adjusted series contain, and how are the seasonal forecasts put back?"],
  "model-comparison": ["Compare Prophet, DHR, and MSTL + ETS by mechanics, assumptions, and use case—not invented performance scores.", "Which trade-offs matter for Northstar's actual decision?"],
};

function Slider({ label, value, min, max, step = 1, onChange, suffix = "", prefix = "" }: { label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void; suffix?: string; prefix?: string }) {
  return <label className="slider-control"><span>{label}<strong>{prefix}{value}{suffix}</strong></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}
function Segments<T extends string | number>({ label, values, value, onChange }: { label: string; values: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return <div className="segment-control"><span className="micro">{label}</span><div className="segments" role="group" aria-label={label}>{values.map(v => <button key={v.value} aria-pressed={v.value === value} className={v.value === value ? "selected" : ""} onClick={() => onChange(v.value)}>{v.label}</button>)}</div></div>;
}
function Hint({ children }: { children: React.ReactNode }) { return <p className="lab-hint"><Info size={15} /><span>{children}</span></p>; }
function Stats({ items }: { items: [string, string][] }) { return <div className="lab-stats">{items.map(([label, value]) => <div key={label}><span className="micro">{label}</span><strong>{value}</strong></div>)}</div>; }

export function Lab({ lesson }: { lesson: Lesson }) {
  const titles: Record<Lesson["lab"], string> = { range: "The further ahead, the wider the range", components: "Build sales from the ingredients", history: "Zoom out. Does the story change?", decomposition: "What does a weekly smoother miss?", baseline: "Give a simple forecast a fair test", growth: "A little growth goes a long way", backtest: "Walk forward through time", metrics: "One big miss changes the score", acf: "Meet a series and its past self", residual: "Is there a pattern left over?", stationary: "Levels versus changes", base: "Change the base. Change the headline.", smoothing: "How quickly should a model react?", fourier: "Add waves, add flexibility", events: "Follow the event, not the date", families: "Choose the tool for the pattern", ar: "Autocorrelation → autoregression", hierarchy: "Do the forecasts add up?", drivers: "Would you know it at forecast time?", plan: "Forecast ≠ target ≠ plan", workflow: "Your roadmap for a new forecasting problem", mstl: "Remove, forecast, project, recombine", "model-comparison": "Prophet vs DHR vs MSTL + ETS" };
  const title = lesson.slug === "holt-winters" ? "Add level, trend, and weekly states" : lesson.slug === "dynamic-harmonic-regression" ? "Waves for seasons. ARIMA for the rest." : titles[lesson.lab];
  const content = () => {
    switch (lesson.lab) {
      case "range": return lesson.slug === "prediction-intervals" ? <IntervalCoverageLab /> : <RangeLab />;
      case "components": return lesson.slug === "holt-winters" ? <HoltWintersLab /> : <ComponentsLab />;
      case "history": return <HistoryForecastLab />;
      case "decomposition": return <DecompositionLab />;
      case "baseline": return <BaselineLab />;
      case "growth": return <GrowthChoiceLab />;
      case "backtest": return <RollingBacktestLab />;
      case "metrics": return <ErrorMetricsLab />;
      case "acf": return <AutocorrelationLab />;
      case "ar": return <ArLab />;
      case "residual": return <ResidualNoiseLab />;
      case "stationary": return <StationaryLab />;
      case "base": return <BaseLab />;
      case "smoothing": return <SmoothingLab id={lesson.id} />;
      case "fourier": return lesson.slug === "dynamic-harmonic-regression" ? <DhrLab /> : <FourierWavesLab />;
      case "events": return <EventLab />;
      case "families": return <FamiliesLab />;
      case "hierarchy": return <HierarchyReconciliationLab />;
      case "drivers": return lesson.slug === "drivers-leakage" ? <DriverForecastLab /> : <DriversLab />;
      case "plan": return <PlanLab />;
      case "workflow": return <WorkflowLab />;
      case "mstl": return <MstlLab />;
      case "model-comparison": return <ModelComparisonLab />;
    }
  };
  const specificNotes = ["history", "growth", "backtest", "metrics", "acf", "residual", "hierarchy"].includes(lesson.lab) || ["prediction-intervals", "drivers-leakage", "holt-winters", "fourier", "dynamic-harmonic-regression"].includes(lesson.slug);
  const explanation = !specificNotes && explainers[lesson.lab];
  return <section className="lab"><div className="lab-heading"><span className="figure-label">{lesson.lab === "model-comparison" ? "TABLE" : "FIG"} {String(lesson.id).padStart(2, "0")}.1</span><h3>{title}</h3></div>{explanation && <div className="lab-explanation"><span className="micro">WHAT THIS SHOWS</span><p>{explanation[0]}</p><p><strong>The question it answers:</strong> {explanation[1]}</p></div>}{content()}{!specificNotes && <details className="lab-fine-print"><summary>Fine print & assumptions</summary><p>{lesson.lab === "workflow" || lesson.lab === "model-comparison" ? "Decision guide: validate each candidate on the actual business decision and future-data tests." : "Constructed teaching data and illustrative calculations, not a production forecasting service. Read the diagram's method notes and distinguish supplied simulator components from fitted estimates."}</p></details>}</section>;
}

function RangeLab() {
  const [horizon, setHorizon] = useState(28), [show, setShow] = useState(true);
  const history = Array.from({ length: 61 }, (_, i) => 27000 + i * 65 + Math.sin(i * 1.7) * 550 + Math.sin(i / 5) * 400);
  const start = history[60];
  const point = Array.from({ length: 121 }, (_, i) => i < 60 ? null : start + (i - 60) * 65);
  const bands = show ? [1.96, 1.282, 0.674].map((z, i) => ({
    low: Array.from({ length: 121 }, (_, j) => j < 60 ? start : start + (j - 60) * 65 - z * 600 * Math.sqrt(j - 60)),
    high: Array.from({ length: 121 }, (_, j) => j < 60 ? start : start + (j - 60) * 65 + z * 600 * Math.sqrt(j - 60)),
    color: ["#e6ebdb", "#cedbb8", "#a8c38c"][i],
  })) : [];
  const estimate = start + horizon * 65, width = 1.282 * 600 * Math.sqrt(horizon);
  return <><div className="lab-controls"><Slider label="How far ahead" value={horizon} min={1} max={60} onChange={setHorizon} suffix=" days" /><button className={`toggle ${show ? "on" : ""}`} aria-pressed={show} onClick={() => setShow(!show)}><span />Show uncertainty</button></div>
    <Chart series={[{ name: "Sales history", values: [...history, ...Array(60).fill(null)], color: ink }, { name: "Point forecast", values: point, color: green, dashed: true }]} bands={bands} labels={[{ at: 0, text: "−60 days" }, { at: 30, text: "−30 days" }, { at: 60, text: "Today" }, { at: 90, text: "+30 days" }, { at: 120, text: "+60 days" }]} marker={{ at: 60 + horizon, text: `+${horizon} days` }} />
    <Stats items={[["Point forecast", money(estimate)], ["Illustrative 80% interval", show ? `${money(estimate - width)} – ${money(estimate + width)}` : "Hidden, not gone"], ["Interval width", show ? money(width * 2) : "Still uncertain"]]} />
    <Hint>Drag from 1 to 60 days, then hide the range. The line looks just as confident—but the uncertainty hasn’t disappeared. Bands here use a simple normal-innovation random-walk illustration (50%, 80%, 95%).</Hint></>;
}

function ComponentsLab() {
  const [growth, setGrowth] = useState(18), [weekly, setWeekly] = useState(12), [holiday, setHoliday] = useState(140), [noise, setNoise] = useState(5), [mode, setMode] = useState("multiplicative");
  const data = useMemo(() => generateSales({ growth, weekly, holiday, noise, multiplicative: mode === "multiplicative" }), [growth, weekly, holiday, noise, mode]);
  return <><div className="lab-controls four"><Slider label="Annual growth" min={0} max={40} value={growth} onChange={setGrowth} suffix="%" /><Slider label="Weekly strength" min={0} max={30} value={weekly} onChange={setWeekly} suffix="%" /><Slider label="Black Friday lift" min={0} max={250} value={holiday} onChange={setHoliday} suffix="%" /><Slider label="Noise" min={0} max={20} value={noise} onChange={setNoise} suffix="%" /></div>
    <Segments label="How effects scale" values={[{ value: "multiplicative", label: "With the business (%)" }, { value: "additive", label: "Fixed dollar scale ($)" }]} value={mode} onChange={setMode} />
    <Chart series={[{ name: "Observed sales", values: data.map(d => d.sales), color: ink }, { name: "Underlying trend", values: data.map(d => d.trend), color: orange }]} labels={dates} />
    <div className="mini-charts"><div><span className="micro">WEEKLY EFFECT · FIRST 4 WEEKS</span><Chart height={160} series={[{ name: "Weekly component", values: data.slice(0, 28).map(d => d.weekly), color: blue }]} /></div><div><span className="micro">EVENT EFFECT · THREE YEARS</span><Chart height={160} series={[{ name: "Black Friday + Cyber Monday", values: data.map(d => d.event), color: purple }]} /></div></div>
    <Hint>Set annual growth to zero. The holiday spikes still return. Now turn Black Friday lift off: permanent growth and recurring events are different ingredients. All component values shown here are known from the simulator.</Hint></>;
}

function HistoryLab() {
  const [window, setWindow] = useState(3), [reveal, setReveal] = useState(false);
  const full = useMemo(() => Array.from({ length: 42 }, (_, i) => { const month = i % 12; return 23000 * 1.14 ** (i / 12) * (1 + [0, -0.05, 0, 0.02, 0.01, 0, -0.02, 0.01, 0.05, 0.15, 0.55, 0.35][month]); }), []);
  const end = 34, start = end - window + 1;
  const visible = full.map((v, i) => i >= start && (i <= end || reveal) ? v : null);
  const slope = (full[end] - full[end - 2]) / 2;
  const extrapolate = full.map((_, i) => i >= end ? full[end] + slope * (i - end) : null);
  return <><div className="lab-controls"><Segments label="History available" value={window} onChange={setWindow} values={[{ value: 3, label: "3 months" }, { value: 12, label: "12 months" }, { value: 33, label: "Almost 3 years" }]} /><button className={`toggle ${reveal ? "on" : ""}`} aria-pressed={reveal} onClick={() => setReveal(!reveal)}><span />Reveal what happens</button></div>
    <Chart series={[{ name: "Hidden context", values: full.map((v, i) => i < start ? v : null), color: "#c3c8bb", dashed: true }, { name: "Sales you can see", values: visible, color: ink }, { name: "Naïve short-window extrapolation", values: extrapolate, color: orange, dashed: true }]} marker={{ at: end, text: "Nov ’25 · forecast origin" }} labels={[{ at: 0, text: "Jan ’23" }, { at: 12, text: "Jan ’24" }, { at: 24, text: "Jan ’25" }, { at: 36, text: "Jan ’26" }]} />
    <Hint>{reveal ? "The holiday peak fades. The orange line extends the last two months’ slope, confusing a recurring ramp with permanent growth." : "The pale line is context deliberately withheld from the learner—not information the short-window forecast can use. Expand the window, then reveal the future."}</Hint></>;
}

function DecompositionLab() {
  const [event, setEvent] = useState(true), [explain, setExplain] = useState(false);
  const data = useMemo(() => generateSales({ holiday: event ? 140 : 0 }), [event]);
  const smoothed = movingAverage(data.map(d => d.sales));
  return <><div className="lab-controls"><button className={`toggle ${event ? "on" : ""}`} aria-pressed={event} onClick={() => setEvent(!event)}><span />Black Friday in data</button><button className={`toggle ${explain ? "on" : ""}`} aria-pressed={explain} onClick={() => setExplain(!explain)}><span />Account for known event</button></div>
    <Chart height={210} series={[{ name: "Observed sales", values: data.map(d => d.sales), color: ink }, { name: "Centered 7-day mean", values: smoothed, color: orange }]} labels={dates} />
    <div className="mini-charts"><div><span className="micro">TRUE TREND · SIMULATOR REFERENCE</span><Chart height={170} series={[{ name: "Known underlying level", values: data.map(d => d.trend), color: green }]} /></div><div><span className="micro">AFTER REMOVING KNOWN COMPONENTS</span><Chart height={170} series={[{ name: explain ? "Noise only" : "Unexplained event + noise", values: data.map(d => d.noise + (explain ? 0 : d.event)), color: purple }]} /></div></div>
    <Hint>The 7-day average is an actual centered smoother, not a full STL decomposition. Lower plots use oracle components from the simulator, not estimated components. The contrast shows why omitting a predictable event leaves structure in the remainder.</Hint></>;
}

function BaselineLab() {
  const [method, setMethod] = useState<BaselineMethod>("weekly");
  const data = useMemo(() => generateSales(), []), cut = 1000, count = 56;
  const actual = data.slice(cut - 56, cut + count).map(d => d.sales);
  const predicted = baselineForecast(data.slice(0, cut).map(d => d.sales), count, method);
  const forecast = [...Array(55).fill(null), data[cut - 1].sales, ...predicted];
  const score = metrics(actual.slice(56), forecast.slice(56) as number[]);
  return <><Segments<BaselineMethod> label="Baseline method" value={method} onChange={setMethod} values={[{ value: "mean", label: "Mean" }, { value: "naive", label: "Last value" }, { value: "weekly", label: "Last week" }, { value: "yearly", label: "364-day lag" }, { value: "drift", label: "Drift" }, { value: "growth", label: "364-day lag × 1.18" }]} />
    <Chart series={[{ name: "Actual sales", values: actual, color: ink }, { name: "Baseline forecast", values: forecast, color: orange, dashed: true }]} marker={{ at: 55, text: "Training ends" }} labels={[{ at: 0, text: "History" }, { at: 55, text: "Forecast origin" }, { at: 111, text: "+56 days" }]} />
    <Stats items={[["Holdout MAE", money(score.mae)], ["Holdout RMSE", money(score.rmse)]]} /><Hint>All baseline inputs come from before the forecast origin. The 18% growth factor is a supplied scenario assumption, not learned from holdout sales. This window illustrates ordinary-day performance; test event windows separately.</Hint></>;
}

function GrowthLab() {
  const [rate, setRate] = useState(18);
  const values = Array.from({ length: 37 }, (_, i) => 30000 * (1 + rate / 100) ** (i / 12));
  return <><Slider label="Annual growth assumption" value={rate} min={-20} max={50} suffix="%" onChange={setRate} /><Chart series={[{ name: "Compounded sales level", values, color: green }]} labels={[{ at: 0, text: "Today" }, { at: 12, text: "+1 year" }, { at: 24, text: "+2 years" }, { at: 36, text: "+3 years" }]} /><Stats items={[["Equivalent monthly rate", `${(((1 + rate / 100) ** (1 / 12) - 1) * 100).toFixed(2)}%`], ["Level in 3 years", money(values[36])]]} /><Hint>This is a growth scenario, not an estimated forecast. Small changes in an annual assumption compound into large long-horizon differences.</Hint></>;
}

function BacktestLab() {
  const [origin, setOrigin] = useState(60), [horizon, setHorizon] = useState(14);
  return <><div className="lab-controls"><Slider label="Forecast origin (day)" value={origin} min={30} max={100} onChange={setOrigin} /><Slider label="Test horizon" value={horizon} min={7} max={28} suffix=" days" onChange={setHorizon} /></div><div className="timeline-stack">{[0, 7, 14].map(offset => { const end = Math.min(origin + offset, 114); return <div className="timeline-row" key={offset}><span>Origin {end}</span><div className="timeline-track"><div className="train-block" style={{ width: `${end / 150 * 100}%` }}>Train</div><div className="test-block" style={{ width: `${horizon / 150 * 100}%` }}>Test</div></div></div>; })}</div><div className="timeline-key"><span><i className="train" />Past data only</span><span><i className="test" />Unseen at this origin</span><span><i />Not yet used</span></div><Hint>Each row is a separate fit. A later origin can use observations that were test data at an earlier origin. Overlapping test windows are normal, but their errors are not independent.</Hint></>;
}

function MetricsLab() {
  const [miss, setMiss] = useState(12000);
  const errors = [1000, -1200, 800, -600, 1400, -900, miss];
  const actual = errors.map(e => 30000 + e), pred = errors.map(() => 30000), score = metrics(actual, pred);
  return <><Slider label="One unusually large miss" value={miss} min={0} max={30000} step={500} onChange={setMiss} prefix="$" /><Chart height={220} series={[{ name: "Actual sales", values: actual, color: ink }, { name: "Forecast", values: pred, color: orange, dashed: true }]} labels={errors.map((_, i) => ({ at: i, text: `Day ${i + 1}` }))} /><Stats items={[["MAE · typical absolute miss", money(score.mae)], ["RMSE · big misses matter more", money(score.rmse)], ["Bias · actual − forecast", money(score.bias)]]} /><Hint>Raise the last day’s miss and watch RMSE pull away from MAE. The same predictions can deserve different scores depending on what you want to penalize.</Hint></>;
}

function ArLab({ acfOnly = false }: { acfOnly?: boolean }) {
  const [phi, setPhi] = useState(0.7), [shock, setShock] = useState(5), [sample, setSample] = useState(false);
  const values = useMemo(() => {
    let state = 0;
    return Array.from({ length: 500 }, (_, i) => { const u = Math.sin((i + 1) * 12.9898) * 43758.5453; state = phi * state + (u - Math.floor(u) - 0.5) * 4; return state; });
  }, [phi]);
  const acf = Array.from({ length: 16 }, (_, i) => {
    if (!sample) return phi ** (i + 1);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0);
    return values.slice(i + 1).reduce((sum, v, j) => sum + (v - mean) * (values[j] - mean), 0) / variance;
  });
  const path = Array.from({ length: 21 }, (_, h) => 30000 + phi ** h * shock * 1000);
  return <><div className="lab-controls"><Slider label="AR coefficient φ" min={-0.95} max={0.95} step={0.05} value={phi} onChange={n => setPhi(Number(n.toFixed(2)))} /><Segments label="ACF view" value={sample ? "sample" : "theory"} onChange={v => setSample(v === "sample")} values={[{ value: "theory", label: "Theoretical" }, { value: "sample", label: "Simulated sample" }]} /></div>
    {!acfOnly && <><Slider label="Today’s deviation from $30k mean" value={shock} min={-10} max={10} onChange={setShock} suffix="k" prefix="$" /><div className="equation-live"><span>TOMORROW’S CONDITIONAL MEAN</span><strong>$30k + {phi.toFixed(2)} × ({shock < 0 ? "−" : "+"}${Math.abs(shock)}k) = <em>{money(path[1])}</em></strong></div><Chart height={220} series={[{ name: "Conditional mean after today’s shock", values: path, color: green }, { name: "Long-run mean μ", values: path.map(() => 30000), color: orange, dashed: true }]} labels={[{ at: 0, text: "Today" }, { at: 5, text: "+5 days" }, { at: 10, text: "+10 days" }, { at: 20, text: "+20 days" }]} /></>}
    {acfOnly && <Chart height={200} money={false} series={[{ name: "Simulated AR(1) deviations", values: values.slice(-100), color: ink }]} labels={[{ at: 0, text: "100 days ago" }, { at: 99, text: "Today" }]} />}
    <div className="acf-heading"><span className="micro">{sample ? "SAMPLE ACF · 500 SIMULATED OBSERVATIONS" : "THEORETICAL ACF(k) = φᵏ"}</span><span>{phi > 0 ? "Positive → persistent" : phi < 0 ? "Negative → alternating" : "Zero → no linear memory"}</span></div><AcfChart values={acf} bounds={sample ? 1.96 / Math.sqrt(500) : undefined} />
    <Stats items={[["Lag 1 correlation", acf[0].toFixed(2)], ["Lag 7 correlation", acf[6].toFixed(2)], ["AR order p", "1 lag"]]} />
    <Hint>Try φ = 0.9, 0, and −0.7. In a stationary pure AR(1), the theoretical ACF decays as φᵏ. Sample estimates wobble around it. {acfOnly ? "Correlation describes the pattern; a fitted AR model uses lagged values as predictors." : "The forecast line is a conditional mean with future innovations set to their expected value, zero—not a simulated future path. ARIMA can apply AR terms after differencing; its MA part uses past innovations, not rolling sales averages."}</Hint></>;
}

function ResidualLab() {
  const [weekly, setWeekly] = useState(false);
  const residuals = Array.from({ length: 84 }, (_, i) => {
    const random = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return (random - Math.floor(random) - 0.5) * 1800 + (weekly ? 0 : Math.cos(i * 2 * Math.PI / 7) * 3000);
  });
  return <><button className={`toggle ${weekly ? "on" : ""}`} aria-pressed={weekly} onClick={() => setWeekly(!weekly)}><span />Model knows the weekly pattern</button><Chart series={[{ name: "Illustrative residuals", values: residuals, color: purple }, { name: "Zero", values: residuals.map(() => 0), color: orange, dashed: true }]} labels={[{ at: 0, text: "Day 1" }, { at: 42, text: "Day 43" }, { at: 83, text: "Day 84" }]} /><Hint>When the weekly pattern is omitted, it survives in the residuals. This is a deliberately constructed illustration, not a fitted model or statistical white-noise test.</Hint></>;
}

function StationaryLab() {
  const [mode, setMode] = useState("level");
  const data = generateSales({ holiday: 0 }).slice(0, 180);
  const values = data.map((d, i) => mode === "level" ? d.sales : mode === "first" ? i === 0 ? null : d.sales - data[i - 1].sales : i < 7 ? null : d.sales - data[i - 7].sales);
  return <><Segments label="Working series" value={mode} onChange={setMode} values={[{ value: "level", label: "Sales level" }, { value: "first", label: "First difference" }, { value: "seasonal", label: "7-day difference" }]} /><Chart series={[{ name: mode === "level" ? "Daily sales" : "Change in sales", values, color: green }]} labels={[{ at: 0, text: "Jan" }, { at: 60, text: "Mar" }, { at: 120, text: "May" }, { at: 179, text: "Jun" }]} /><Hint>First differences expose day-to-day changes; seasonal differences compare the same weekday. These transformations do not automatically guarantee stationarity or remove a moving event.</Hint></>;
}

function BaseLab() {
  const [lastYear, setLastYear] = useState(30000); const current = 40000;
  return <><Slider label="Last year’s event sales" value={lastYear} min={15000} max={45000} step={1000} prefix="$" onChange={setLastYear} /><div className="comparison-bars"><div><span>Last year</span><i style={{ width: `${lastYear / 50000 * 100}%`, background: blue }} /><strong>{money(lastYear)}</strong></div><div><span>This year</span><i style={{ width: "80%", background: green }} /><strong>{money(current)}</strong></div></div><Stats items={[["Reported YoY growth", `${((current / lastYear - 1) * 100).toFixed(1)}%`], ["This year’s sales", "$40k · unchanged"]]} /><Hint>Reduce last year’s sales to simulate an outage. The headline growth rate rockets upward—even though this year’s result hasn’t moved at all.</Hint></>;
}

function SmoothingLab({ id }: { id: number }) {
  const [alpha, setAlpha] = useState(0.25), [damping, setDamping] = useState(true);
  const values = Array.from({ length: 70 }, (_, i) => 26000 + (i > 35 ? 6000 : 0) + Math.sin(i * 3.7) * 2100);
  let level = values[0];
  const smooth = values.map(v => level = alpha * v + (1 - alpha) * level);
  const slope = id === 14 ? 150 : 0;
  const forecast = Array.from({ length: 90 }, (_, i) => i < 69 ? null : smooth[69] + (damping ? slope * (1 - 0.85 ** (i - 69)) / (1 - 0.85) * 0.85 : slope * (i - 69)));
  return <><div className="lab-controls"><Slider label="Level smoothing α" value={alpha} min={0.05} max={1} step={0.05} onChange={n => setAlpha(Number(n.toFixed(2)))} />{id === 14 && <button className={`toggle ${damping ? "on" : ""}`} aria-pressed={damping} onClick={() => setDamping(!damping)}><span />Damp illustrative trend</button>}</div><Chart series={[{ name: "Observed sales", values: [...values, ...Array(20).fill(null)], color: "#bdc7b8" }, { name: "Smoothed level", values: [...smooth, ...Array(20).fill(null)], color: green }, { name: "Illustrative forecast", values: forecast, color: orange, dashed: true }]} marker={{ at: 69, text: "Today" }} labels={[{ at: 0, text: "History" }, { at: 35, text: "Level shift" }, { at: 89, text: "+20 days" }]} /><Hint>Higher α follows the level shift faster but also follows noise. {id === 14 ? "The future trend here is a supplied $150/day illustration, not an estimated Holt trend; toggle damping to compare extrapolation shapes." : "This playground computes SES level updates, not a full seasonal ETS fit. SES point forecasts are flat beyond the last observation."}</Hint></>;
}

function EventLab() {
  const [align, setAlign] = useState("event");
  const years = [2023, 2024, 2025, 2026];
  const series = years.map((year, i) => {
    const day = blackFriday(year).getUTCDate();
    const center = align === "event" ? 14 : day - 10;
    return { name: `${year} · Nov ${day}`, color: [green, blue, orange, purple][i], values: Array.from({ length: 31 }, (_, j) => 24000 + 32000 * Math.exp(-((j - center) ** 2) / 5) + 10000 * Math.exp(-((j - center - 3) ** 2) / 2)) };
  });
  return <><Segments label="Align sales by" value={align} onChange={setAlign} values={[{ value: "event", label: "Days from Black Friday" }, { value: "calendar", label: "Calendar date" }]} /><Chart series={series} labels={align === "event" ? [{ at: 0, text: "−14 days" }, { at: 14, text: "Black Friday" }, { at: 17, text: "Cyber Monday" }, { at: 30, text: "+16 days" }] : [{ at: 0, text: "Nov 10" }, { at: 10, text: "Nov 20" }, { at: 20, text: "Nov 30" }, { at: 30, text: "Dec 10" }]} /><div className="event-dates">{years.map(year => <div key={year}><span>{year}</span><strong>Nov {blackFriday(year).getUTCDate()}</strong></div>)}</div><Hint>These years use the same illustrative event lift. Event alignment reveals that identical shape; calendar-date alignment shifts it. In real data, discounting, stock, and demand also change the peak height.</Hint></>;
}

function FamiliesLab() {
  const [family, setFamily] = useState("ETS");
  const text: Record<string, [string, string, string]> = { ETS: ["Evolving components", "Level, trend, seasonal states", "Simple, stable seasonal patterns"], ARIMA: ["Temporal dependence", "Lagged values and innovations after differencing", "Short-run memory and stochastic trends"], Regression: ["Known explanatory features", "Calendar, prices, promotions, Fourier terms", "Known future drivers or explicit scenarios"], "Machine learning": ["Flexible learned relationships", "Lagged features, calendars, related series", "Rich data with honest time-aware validation"] };
  return <><Segments label="Model family" value={family} onChange={setFamily} values={Object.keys(text).map(value => ({ value, label: value }))} /><div className="family-card"><span className="micro">{family.toUpperCase()} · MENTAL MODEL</span><h4>{text[family][0]}</h4><p>{text[family][1]}</p><span className="family-fit">Useful starting point: {text[family][2]}</span></div><Hint>These are rough strengths, not strict boundaries. Hybrid models combine ideas. Compare every candidate with the same baseline, origins, and horizons.</Hint></>;
}

function HierarchyLab() {
  const [home, setHome] = useState(42), [apparel, setApparel] = useState(35), [tech, setTech] = useState(28), [coherent, setCoherent] = useState(false);
  const total = coherent ? home + apparel + tech : 120;
  return <><div className="lab-controls"><Slider label="Home forecast" value={home} min={10} max={80} suffix="k" prefix="$" onChange={setHome} /><Slider label="Apparel forecast" value={apparel} min={10} max={80} suffix="k" prefix="$" onChange={setApparel} /><Slider label="Tech forecast" value={tech} min={10} max={80} suffix="k" prefix="$" onChange={setTech} /></div><div className="hierarchy"><div className="hierarchy-total"><span>Northstar · total</span><strong>${total}k</strong></div><div className="hierarchy-children">{[["Home", home], ["Apparel", apparel], ["Tech", tech]].map(([label, value]) => <div key={label}><span>{label}</span><strong>${value}k</strong></div>)}</div></div><button className={`toggle ${coherent ? "on" : ""}`} aria-pressed={coherent} onClick={() => setCoherent(!coherent)}><span />Use bottom-up aggregation</button><Hint>{coherent ? "The total now equals the sum of categories. This is bottom-up aggregation, not MinT reconciliation." : `Independent total: $120k. Categories sum to $${home + apparel + tech}k. Gap: $${120 - home - apparel - tech}k. Coherence is not guaranteed when levels are forecast separately.`}</Hint></>;
}

function DriversLab() {
  const [selected, setSelected] = useState<string[]>([]);
  const features = [{ name: "Black Friday calendar date", safe: true, why: "Known in advance." }, { name: "Planned discount depth", safe: true, why: "Safe if this plan was recorded at the forecast date." }, { name: "Lagged sales up to yesterday", safe: true, why: "Past information, subject to reporting delay." }, { name: "Realized future ad clicks", safe: false, why: "Not known in advance. Forecast them or use scenarios." }, { name: "Centered 7-day average at today", safe: false, why: "Needs three future days. Use a trailing window instead." }, { name: "Actual Black Friday conversion", safe: false, why: "A future outcome, not an available predictor." }];
  return <><p className="lab-prompt">Tap a feature to check whether it crosses the information boundary.</p><div className="feature-list">{features.map(f => <button key={f.name} className={selected.includes(f.name) ? f.safe ? "safe" : "unsafe" : ""} onClick={() => setSelected(s => s.includes(f.name) ? s.filter(n => n !== f.name) : [...s, f.name])}><span>{f.name}</span>{selected.includes(f.name) ? <small><b>{f.safe ? "AVAILABLE" : "LEAKAGE RISK"}</b> {f.why}</small> : <ArrowRight size={16} />}</button>)}</div><Hint>Availability is a timestamped fact, not just a column name. Store what was actually known at each forecast origin.</Hint></>;
}

function PlanLab() {
  const [lift, setLift] = useState(10);
  return <><Slider label="Assumed incremental promotion lift" value={lift} min={0} max={30} suffix="%" onChange={setLift} /><div className="decision-cards"><div><span className="micro">BASELINE FORECAST</span><strong>$1.1m</strong><p>Expectation without a new action</p></div><div><span className="micro">SCENARIO WITH PLAN</span><strong>${(1.1 * (1 + lift / 100)).toFixed(2)}m</strong><p>Conditional on the assumed lift</p></div><div><span className="micro">SALES TARGET</span><strong>$1.3m</strong><p>An ambition, not a prediction</p></div></div><Hint>Move the assumed lift. The scenario changes; the baseline and target do not. A promotion’s incremental effect is uncertain and should be supported by evidence.</Hint></>;
}

export function ResetLabButton({ onClick }: { onClick: () => void }) { return <button className="text-button" onClick={onClick}><RotateCcw size={13} />Reset diagram</button>; }
