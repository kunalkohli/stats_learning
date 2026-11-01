"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { lessons } from "@/lib/curriculum";
import { workflowSteps, modelBranches } from "@/lib/workflow";

function Revisit({ ids }: { ids: number[] }) {
  return <div className="workflow-revisit"><span className="micro">REVISIT</span>{ids.map(id => {
    const lesson = lessons.find(l => l.id === id)!;
    return <Link key={id} href={`/forecasting/${lesson.slug}`}>{String(id).padStart(2, "0")} · {lesson.title}<ArrowUpRight size={11} /></Link>;
  })}</div>;
}

export function WorkflowLab() {
  const [openStep, setOpenStep] = useState(0);
  const [branchId, setBranchId] = useState("northstar");
  const branch = modelBranches.find(b => b.id === branchId)!;

  return <div className="workflow-lab">
    <p className="lab-prompt">Select a step to read its explanation right underneath. Only one step stays open at a time.</p>
    <ol className="workflow-flow" aria-label="Forecasting workflow steps">{workflowSteps.map((s, i) => {
      const open = openStep === i;
      return <li key={s.title}>
        <h4 className="workflow-step-heading"><button id={`workflow-step-${i + 1}`} aria-expanded={open} aria-disabled={open} aria-controls={`workflow-detail-${i + 1}`} onClick={() => setOpenStep(i)} className={open ? "selected" : ""}>
          <span className="workflow-step-number">{String(i + 1).padStart(2, "0")}</span><span><strong>{s.title}</strong><small>{s.summary}</small></span><ChevronDown size={16} className="workflow-chevron" />
        </button></h4>
        <div id={`workflow-detail-${i + 1}`} className="workflow-step-detail" role="region" aria-labelledby={`workflow-step-${i + 1}`} hidden={!open}>
          <span className="micro">WHAT TO DO</span><p>{s.action}</p>
          <div className="workflow-example"><span className="micro">AT NORTHSTAR</span><p>{s.example}</p></div>
          <div className="workflow-output"><span className="micro">LEAVE THIS STEP WITH</span><p>{s.output}</p></div>
          <Revisit ids={s.refs} />
        </div>
      </li>;
    })}</ol>

    <div className="workflow-loop"><span>↺</span><p><strong>No reliable improvement?</strong> Keep the simpler method, or return to audit and diagnosis. You do not have to try every model family.</p></div>

    <section className="workflow-model-guide" aria-labelledby="workflow-model-title">
      <span className="micro">THE BRANCH AT STEP 6</span><h4 id="workflow-model-title">What should I try next?</h4>
      <p>Pick the pattern you observed. This suggests an experiment—not a guaranteed winner.</p>
      <label htmlFor="workflow-pattern">What does your series or its errors look like?</label>
      <select id="workflow-pattern" value={branchId} onChange={e => setBranchId(e.target.value)}>{modelBranches.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}</select>
      <div className="workflow-recommendation" aria-live="polite">
        <dl><div><dt>KEEP AS THE BENCHMARK</dt><dd>{branch.baseline}</dd></div><div><dt>CANDIDATE TO TEST</dt><dd>{branch.candidate}</dd></div></dl>
        <p>{branch.why}</p><p className="workflow-caution"><strong>Watch out:</strong> {branch.avoid}</p>
        <Revisit ids={branch.refs} />
      </div>
    </section>

    <div className="workflow-recipe"><span className="micro">A PRACTICAL FIRST PASS FOR NORTHSTAR</span><p>Agree on the 42-day decision → audit sales and availability → benchmark weekly and event-aligned naïve forecasts → evaluate rolling 42-day forecasts → inspect weekday and Black Friday misses → test calendar/Fourier regression with explicit event windows → add ARIMA errors only if useful → compare, refit, and monitor.</p></div>
    <p className="lab-hint">STL/MSTL helps explore components. ETS is a forecasting family. Fourier terms represent smooth seasonality. They solve different problems and are not mandatory stages in one fixed sequence.</p>
  </div>;
}
