"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Chart } from "./chart";
import { generateSales } from "@/lib/forecast";
import { comparisonRows, comparisonCases } from "@/lib/model-comparison";

export function MstlLab() {
  const [weekly, setWeekly] = useState(true);
  const [annual, setAnnual] = useState(true);
  const [stage, setStage] = useState("adjust");
  const data = useMemo(() => generateSales({ holiday: 0 }), []);
  const cut = 1000;
  const history = data.slice(cut - 84, cut);
  // Oracle components deliberately isolate the pipeline idea; no MSTL/ETS is fitted here.
  const future = data.slice(cut, cut + 42);
  const adjusted = history.map(d => d.sales - (weekly ? d.weekly : 0) - (annual ? d.annual : 0));
  const lastLevel = history.at(-1)!.trend;
  const projectedLevel = future.map((_, i) => lastLevel + (i + 1) * 18);
  const weeklyProjection = future.map((_, i) => data[cut - 7 + i % 7].weekly);
  const annualProjection = future.map((_, i) => data[cut - 365 + i].annual);
  const seasonalProjection = future.map((_, i) => (weekly ? weeklyProjection[i] : 0) + (annual ? annualProjection[i] : 0));
  const stages = [
    { id: "adjust", title: "1. Remove seasons", text: "Subtract the weekly and yearly components. What remains is the seasonally adjusted series: trend plus remainder. It still contains noise. Toggle each component to see what is left when a seasonal pattern is not removed." },
    { id: "forecast", title: "2. Forecast adjusted", text: "Fit nonseasonal ETS to the adjusted training series. This illustration supplies a level/trend projection instead of fitting ETS. The input is not the remainder alone, and the forecast is not a promise about future observations." },
    { id: "seasons", title: "3. Project seasons", text: "In the common pipeline, repeat the last estimated cycle of each seasonal component. This schematic repeats a 7-day weekly component and a 365-day annual component; the annual slot is only a simplification, not leap-year or moving-holiday handling." },
    { id: "recombine", title: "4. Add them back", text: "Add the adjusted-series forecast and projected seasons on the modeling scale. A moving holiday would need a separate event effect. On a transformed scale, back-transform the combined forecast carefully and consider bias adjustment when the desired output is a mean." },
  ];
  const active = stages.find(s => s.id === stage)!;
  const padding = Array(42).fill(null);
  const labels = [{ at: 0, text: "Training history" }, { at: 83, text: "Forecast origin" }, { at: 125, text: "+42 days" }];
  return <>
    <p className="seasonal-disclaimer">Schematic only: known simulator components and a supplied trend projection. This is not an estimated MSTL + ETS fit or an accuracy comparison.</p>
    <div className="seasonal-stage-buttons" role="group" aria-label="MSTL forecasting pipeline">{stages.map(s => <button key={s.id} aria-pressed={stage === s.id} onClick={() => setStage(s.id)}>{s.title}</button>)}</div>
    <div className="seasonal-stage-explanation" aria-live="polite"><h4>{active.title}</h4><p>{active.text}</p></div>
    <div className="lab-controls">
      <button className={`toggle ${weekly ? "on" : ""}`} aria-pressed={weekly} onClick={() => setWeekly(!weekly)}><span />Weekly component</button>
      <button className={`toggle ${annual ? "on" : ""}`} aria-pressed={annual} onClick={() => setAnnual(!annual)}><span />Yearly component</button>
    </div>
    <Chart title="Schematic MSTL and ETS pipeline" marker={{ at: 83, text: "Training ends" }} labels={labels} series={stage === "adjust" ? [
      { name: "Observed training sales", values: [...history.map(d => d.sales), ...padding], color: "#a3ab95" },
      { name: "After selected seasonal removals", values: [...adjusted, ...padding], color: "#547257" },
    ] : stage === "seasons" ? [
      { name: "Selected historical seasonal components", values: [...history.map(d => (weekly ? d.weekly : 0) + (annual ? d.annual : 0)), ...padding], color: "#a3ab95" },
      { name: "Repeated component cycles", values: [...Array(84).fill(null), ...seasonalProjection], color: "#8770a5", dashed: true },
    ] : [
      { name: "Adjusted training series", values: [...adjusted, ...padding], color: "#a3ab95" },
      { name: stage === "recombine" ? "Recombined illustrative forecast" : "Supplied adjusted-series projection", values: [...Array(84).fill(null), ...projectedLevel.map((v, i) => v + (stage === "recombine" ? seasonalProjection[i] : 0))], color: "#547257", dashed: true },
    ]} />
    <p className="lab-hint"><span>The example excludes Black Friday to isolate the seasonal pipeline. Neither a repeated annual slot nor MSTL itself solves a moving event calendar. <Link href="/forecasting/events-holidays">Revisit event handling →</Link></span></p>
  </>;
}

export function ModelComparisonLab() {
  const [filter, setFilter] = useState("all");
  const [caseId, setCaseId] = useState("calendar");
  const active = comparisonCases.find(c => c.id === caseId)!;
  const rows = comparisonRows.filter(r => filter === "all" || r.group === filter);
  return <div className="model-comparison">
    <p className="lab-prompt">Compare the standard versions of these pipelines. Extensions and implementation defaults can change their behavior.</p>
    <div className="comparison-filters" role="group" aria-label="Comparison topics">{[{ id: "all", title: "Full table" }, { id: "tradeoffs", title: "Strengths & weaknesses" }, { id: "mechanics", title: "What each does" }, { id: "calendar", title: "Calendar & drivers" }].map(f => <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.title}</button>)}</div>
    <table className="comparison-table">
      <caption>Prophet vs DHR vs MSTL + ETS: assumptions, strengths, and limitations</caption>
      <thead><tr><th scope="col">Compare</th><th scope="col">Prophet</th><th scope="col">DHR</th><th scope="col">MSTL + ETS</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.topic}><th scope="row">{row.topic}</th><td data-model="Prophet">{row.prophet}</td><td data-model="DHR">{row.dhr}</td><td data-model="MSTL + ETS">{row.mstl}</td></tr>)}</tbody>
    </table>
    <div className="comparison-scenario"><label htmlFor="comparison-case">What matters most in your use case?</label><select id="comparison-case" value={caseId} onChange={e => setCaseId(e.target.value)}>{comparisonCases.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select><p aria-live="polite">{active.guidance}</p></div>
    <div className="comparison-verdict"><strong>A fair test, not a popularity contest.</strong><p>Same forecast origins, horizons, known-ahead inputs, preprocessing rules, and baselines. Check MAE/loss, bias, event-specific errors, interval coverage, runtime, and maintenance. There is no universal best model.</p></div>
    <nav className="comparison-links" aria-label="Revisit the compared models"><Link href="/forecasting/prophet">Prophet →</Link><Link href="/forecasting/dynamic-harmonic-regression">DHR →</Link><Link href="/forecasting/mstl-ets">MSTL + ETS →</Link></nav>
  </div>;
}
