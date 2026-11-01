"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { LabGuide } from "@/lib/journey-guides";

type Idea = { intro: string; points: { title: string; text: string }[]; formula?: string; takeaway: string };

/** A small reading deck, a playground, and a deliberate check — shared by both journeys. */
export function FocusLesson({ title, idea, lab, check, notebook, reading, next, reset, guide }: {
  title: React.ReactNode; guide?: LabGuide;
  idea: Idea; lab: React.ReactNode; check: React.ReactNode; notebook: React.ReactNode;
  reading: React.ReactNode; next: React.ReactNode; reset: React.ReactNode;
}) {
  const [mode, setMode] = useState<"learn" | "explore" | "check">("learn");
  const [card, setCard] = useState(0);
  const cards = [{ title: "The setup", text: idea.intro }, ...idea.points, { title: "Take it with you", text: idea.takeaway }];
  const mission = guide ?? { title: "Make the idea visible.", steps: [`Before changing a control, predict what you expect to see. Look for this distinction: ${idea.points[0].title}`, `Change one setting, then explain the result in your own words. ${idea.takeaway}`] };
  return <div className="focus-experience">
    <div className="focus-titlebar">{title}<div className="focus-tabs" role="group" aria-label="Lesson mode">{(["learn", "explore", "check"] as const).map((m, i) => <button key={m} aria-label={`${String(i + 1).padStart(2, "0")} · ${m[0].toUpperCase() + m.slice(1)}`} aria-pressed={mode === m} onClick={() => setMode(m)}><span className="mode-number" aria-hidden="true">{i + 1}</span>{m[0].toUpperCase() + m.slice(1)}</button>)}</div></div>
    {mode === "learn" && <section className="reading-deck" aria-label="Concept cards">
      <div className="window-bar"><span>CONCEPT CARD {card + 1} / {cards.length}</span><span aria-hidden="true">● ● ●</span></div>
      <div className="deck-content" aria-live="polite"><span className="deck-icon" aria-hidden="true">✳</span><h2>{cards[card].title}</h2><p>{cards[card].text}</p>{card === cards.length - 1 && idea.formula && <div className="formula">{idea.formula}</div>}</div>
      <div className="deck-footer"><button disabled={card === 0} onClick={() => setCard(c => c - 1)}><ArrowLeft size={12} />Back</button><div className="deck-dots" aria-hidden="true">{cards.map((_, i) => <i className={i === card ? "active" : ""} key={i} />)}</div><button className="deck-next" onClick={() => card < cards.length - 1 ? setCard(c => c + 1) : setMode("explore")}>{card < cards.length - 1 ? "Next" : "Explore"}<ArrowRight size={12} /></button></div>
    </section>}
    {mode === "explore" && <div className="focus-playground"><div><div className="lab-toolbar">{reset}</div>{lab}</div><aside className="mission-card"><span className="micro">GUIDED STEPS</span><h2>{mission.title}</h2><ol className="guided-steps">{mission.steps.map(step => <li key={step}>{step}</li>)}</ol><button onClick={() => setMode("check")}>Check yourself →</button></aside></div>}
    {mode === "check" && <div className="focus-check">{check}{notebook}{reading}{next}</div>}
  </div>;
}
