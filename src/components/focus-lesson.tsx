"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { LabGuide } from "@/lib/journey-guides";
import { buildReadingPages, type ReadingIdea } from "@/lib/reading-pages";
import type { LessonTeaching } from "@/lib/lesson-teaching";
import { LessonCase } from "./lesson-teaching";

/** Grouped reading, a playground, and a deliberate check — shared by both journeys. */
export function FocusLesson({ title, idea, teaching, lab, check, notebook, reading, next, reset, guide }: {
  title: React.ReactNode; guide?: LabGuide;
  teaching?: LessonTeaching;
  idea: ReadingIdea; lab: React.ReactNode; check: React.ReactNode; notebook: React.ReactNode;
  reading: React.ReactNode; next: React.ReactNode; reset: React.ReactNode;
}) {
  const [mode, setMode] = useState<"learn" | "explore" | "check">("learn");
  const [page, setPage] = useState(0);
  const pages = buildReadingPages(idea);
  const current = Math.min(page, pages.length - 1), blocks = pages[current];
  const totalIdeas = idea.points.length + 2;
  const mission = guide ?? { title: "Make the idea visible.", steps: [`Before changing a control, predict what you expect to see. Look for this distinction: ${idea.points[0].title}`, `Change one setting, then explain the result in your own words. ${idea.takeaway}`] };
  return <div className="focus-experience">
    <div className="focus-titlebar">{title}<div className="focus-tabs" role="group" aria-label="Lesson mode">{(["learn", "explore", "check"] as const).map((m, i) => <button key={m} aria-label={`${String(i + 1).padStart(2, "0")} · ${m[0].toUpperCase() + m.slice(1)}`} aria-pressed={mode === m} onClick={() => setMode(m)}><span className="mode-number" aria-hidden="true">{i + 1}</span>{m[0].toUpperCase() + m.slice(1)}</button>)}</div></div>
    {mode === "learn" && <section className="reading-deck" aria-label="Concept cards">
      <div className="window-bar"><span>IDEAS {blocks[0].number}–{blocks[blocks.length - 1].number} OF {totalIdeas}</span><span aria-hidden="true">● ● ●</span></div>
      <div className="deck-content" data-block-count={blocks.length} aria-live="polite" aria-atomic="true">{blocks.map(block => <section className={`reading-block ${block.takeaway ? "reading-takeaway" : ""}`} key={block.number}>
        <div className="reading-block-heading"><span className="reading-number" aria-hidden="true">{String(block.number).padStart(2, "0")}</span><h2>{teaching?.pointExamples[block.number - 2] && <span className="lesson-row-emoji" aria-hidden="true">{teaching.pointExamples[block.number - 2].emoji}</span>}{block.title}</h2></div>
        <p>{block.text}</p>
        {block.number === 1 && teaching?.caseStudy && <LessonCase study={teaching.caseStudy} />}
        {!block.takeaway && block.number > 1 && teaching?.pointExamples[block.number - 2] && <aside className="reading-example"><span className="micro">AT NORTHSTAR</span><p>{teaching.pointExamples[block.number - 2].example}</p></aside>}
        {block.formula && <div className="formula">{block.formula}</div>}
      </section>)}</div>
      <div className="deck-footer"><button disabled={current === 0} onClick={() => setPage(p => p - 1)}><ArrowLeft size={12} />Back</button><span className="deck-page-progress">Page {current + 1} of {pages.length}</span><button className="deck-next" onClick={() => current < pages.length - 1 ? setPage(p => p + 1) : setMode("explore")}>{current < pages.length - 1 ? "Next" : "Explore"}<ArrowRight size={12} /></button></div>
    </section>}
    {mode === "explore" && <div className="focus-playground"><div><div className="lab-toolbar">{reset}</div>{lab}</div><aside className="mission-card"><span className="micro">GUIDED STEPS</span><h2>{mission.title}</h2><ol className="guided-steps">{mission.steps.map(step => <li key={step}>{step}</li>)}</ol><button onClick={() => setMode("check")}>Check yourself →</button></aside></div>}
    {mode === "check" && <div className="focus-check">{check}{notebook}{reading}{next}</div>}
  </div>;
}
