"use client";

import { useState } from "react";
import type { LabGuide } from "@/lib/journey-guides";
import { buildReadingPages, type ReadingIdea } from "@/lib/reading-pages";
import type { LessonTeaching } from "@/lib/lesson-teaching";
import { LessonCase, TeachingTable, BaselineComparison, RememberThis } from "./lesson-teaching";

export function FocusLesson({ title, idea, teaching, lab, check, notebook, reading, next, reset, guide }: {
  title: React.ReactNode; guide?: LabGuide; teaching?: LessonTeaching;
  idea: ReadingIdea; lab: React.ReactNode; check: React.ReactNode; notebook: React.ReactNode;
  reading: React.ReactNode; next: React.ReactNode; reset: React.ReactNode;
}) {
  const [mode, setMode] = useState<"learn" | "explore" | "check">("learn");
  const comparison = teaching?.table.firstColumn === "Component" || !!teaching?.baselineComparison || !!teaching?.overview;
  const groups = comparison ? [] : buildReadingPages(idea).slice(1, -1);
  const count = 3 + (comparison ? 1 : groups.length);
  const mission = guide ?? { title: "Make the idea visible.", steps: [`Predict what you expect before changing a control. ${idea.points[0]?.title ?? "Inspect the result."}`, idea.takeaway] };
  const cardHeading = (number: number, icon: string, text: string) => <div className="learning-card-heading"><span className="learning-card-number">{number}</span><span className="learning-card-icon" aria-hidden="true">{icon}</span><h2>{text}</h2></div>;
  return <div className="focus-experience">
    <div className="focus-titlebar">{title}<div className="focus-tabs" role="group" aria-label="Lesson mode">{(["learn", "explore", "check"] as const).map((m, i) => <button key={m} aria-label={`${String(i + 1).padStart(2, "0")} · ${m[0].toUpperCase() + m.slice(1)}`} aria-pressed={mode === m} onClick={() => setMode(m)}><span className="mode-number" aria-hidden="true">{i + 1}</span>{m[0].toUpperCase() + m.slice(1)}</button>)}</div></div>
    {mode === "learn" && <section className="learning-cards" aria-label="Concept cards">
      <div className="learning-cards-intro"><span>{count} SHORT CARDS</span><p>Read top to bottom, then explore in the lab.</p></div>
      <section className="learning-card">{cardHeading(1, "💡", "The big idea")}<p className="learning-card-lead">{idea.intro}</p>{!comparison && idea.points[0] && <dl className="big-idea-definition"><dt>{idea.points[0].title}</dt><dd>{idea.points[0].text}</dd></dl>}{teaching?.caseStudy && <LessonCase study={teaching.caseStudy} />}{comparison && (teaching?.baselineComparison ? <BaselineComparison rows={teaching.baselineComparison} /> : <TeachingTable data={teaching!.overview ?? teaching!.table} />)}</section>
      <section className="learning-card">{cardHeading(2, "📝", "Why it matters")}<p className="learning-card-lead">{teaching?.why ?? teaching?.pointExamples[0]?.example ?? idea.points[0]?.text}</p></section>
      {comparison ? <>
        <section className="learning-card">{cardHeading(3, "📊", "How it works")}{teaching?.secondary ? <TeachingTable data={teaching.secondary} /> : teaching?.how ? <dl className="learning-how">{teaching.how.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.text}</dd></div>)}</dl> : <><p className="learning-card-lead">For Northstar's daily sales, a 364-day lag aligns weekdays—not necessarily moving holidays. Align Black Friday to the event itself.</p><p className="learning-card-lead">Use only training history and growth assumptions available at the forecast origin. Compare each baseline on the same unseen period before choosing a more complex model.</p></>}</section>
      </> : groups.map((blocks, i) => <section className="learning-card" key={i}>
        {cardHeading(i + 3, "📊", groups.length > 1 ? `How it works · ${i + 1} of ${groups.length}` : "How it works")}
        <TeachingTable data={{ label: `Concepts ${blocks[0].number - 1}–${blocks.at(-1)!.number - 1}`, rows: blocks.map(block => ({ concept: block.title, meaning: block.text, emoji: teaching?.pointExamples[block.number - 2]?.emoji ?? "🔎", example: teaching?.pointExamples[block.number - 2]?.example ?? "Connect this idea to the Northstar decision described above." })) }} />
      </section>)}
      <section className="learning-card learning-remember">{cardHeading(count, "⭐", "Remember this")}<RememberThis heading={false} text={idea.takeaway} formula={idea.formula} /><p className="learning-next-note">Next: change something in the lab, then check your understanding.</p><button className="button primary" onClick={() => setMode("explore")}>Explore in the lab →</button></section>
    </section>}
    {mode === "explore" && <div className="focus-playground"><div><div className="lab-toolbar">{reset}</div>{lab}</div><aside className="mission-card"><span className="micro">GUIDED STEPS</span><h2>{mission.title}</h2><ol className="guided-steps">{mission.steps.map(step => <li key={step}>{step}</li>)}</ol><button onClick={() => setMode("check")}>Check yourself →</button></aside></div>}
    {mode === "check" && <div className="focus-check">{check}{notebook}{reading}{next}</div>}
  </div>;
}
