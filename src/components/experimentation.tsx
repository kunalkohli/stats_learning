"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, Download, Menu, PenLine, X } from "lucide-react";
import { experimentLessons as lessons, experimentParts as parts, experimentUrl, type ExperimentLesson } from "@/lib/experimentation";
import { restoreExperimentProgress } from "@/lib/experiment-math";
import type { Progress } from "@/lib/progress";
import { FocusLesson } from "./focus-lesson";
import { ExperimentLab } from "./experiment-labs";
import { JourneyLinks, DisplayControls, useLayoutPreference } from "./layout-preference";
import { experimentGuide } from "@/lib/journey-guides";
import { JourneyParts } from "./journey-parts";
import { ResetLabButton } from "./labs";
import { getLessonTeaching } from "@/lib/lesson-teaching";
import { LessonConceptTables, RememberThis } from "./lesson-teaching";

const KEY = "statsconcepts-experimentation-progress-v1";
export function useExperimentProgress() {
  const [progress, setProgress] = useState<Progress>({ understood: [], notes: {}, lastLesson: 1 });
  const [ready, setReady] = useState(false), [storageError, setError] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setProgress(restoreExperimentProgress(JSON.parse(raw), lessons.length));
    } catch { setError(true); }
    setReady(true);
  }, []);
  function update(fn: (p: Progress) => Progress) {
    setProgress(p => {
      const next = fn(p);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { setError(true); }
      return next;
    });
  }
  return { progress, ready, storageError, update };
}

export function Experimentation({ lesson }: { lesson?: ExperimentLesson }) {
  const teaching = lesson ? getLessonTeaching("experimentation", lesson) : undefined;
  const { progress, ready, storageError, update } = useExperimentProgress();
  const { layout } = useLayoutPreference();
  const [sidebarOpen, setSidebarOpen] = useState(false), [desktopHidden, setDesktopHidden] = useState(false), [isMobile, setIsMobile] = useState(false);
  const [choice, setChoice] = useState<number | null>(null), [labKey, setLabKey] = useState(0);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const sync = () => setIsMobile(media.matches);
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (ready && lesson && progress.lastLesson !== lesson.id) update(p => ({ ...p, lastLesson: lesson.id }));
  }, [ready, lesson?.id]);
  const understood = !!lesson && progress.understood.includes(lesson.id);
  const next = lesson && lessons[lesson.id], prev = lesson && lessons[lesson.id - 2];
  const completion = <button disabled={!ready} className={`button ${understood ? "completed" : "secondary"}`} aria-pressed={understood} onClick={() => lesson && update(p => ({ ...p, understood: understood ? p.understood.filter(id => id !== lesson.id) : [...p.understood, lesson.id] }))}>{understood ? <CheckCircle2 size={14} /> : <Circle size={14} />}{understood ? "Marked as understood" : "Mark as understood"}</button>;
  const lab = lesson && <ExperimentLab key={labKey} lesson={lesson} />;
  const reset = <ResetLabButton onClick={() => setLabKey(k => k + 1)} />;
  const quiz = lesson && <section className="quiz"><span className="micro">CHECK YOURSELF · CHOOSE AN ANSWER</span><h3>{lesson.question}</h3><div className="quiz-options">{lesson.choices.map((c, i) => <button key={c} aria-pressed={choice === i} className={choice === i ? i === lesson.correct ? "correct" : "incorrect" : ""} onClick={() => setChoice(i)}><span>{choice === i ? i === lesson.correct ? <Check size={15} /> : <X size={15} /> : String.fromCharCode(65 + i)}</span>{c}</button>)}</div>{choice !== null && <div className={`quiz-answer ${choice === lesson.correct ? "correct" : ""}`} role="status"><strong>{choice === lesson.correct ? "That’s the idea." : "Not quite—here’s the distinction."}</strong><p>{lesson.answer}</p></div>}</section>;
  const notebook = lesson && <section className="personal-note"><div><PenLine size={16} /><h3>Your learning note</h3><span>{progress.notes[lesson.id] ? storageError ? "Not saved" : "Saved in this browser" : "Private · just for you"}</span></div><label className="sr-only" htmlFor="experiment-note">Your note for {lesson.title}</label><textarea id="experiment-note" disabled={!ready} value={progress.notes[lesson.id] || ""} placeholder="What would you check before running this at work?" onChange={e => update(p => ({ ...p, notes: { ...p.notes, [lesson.id]: e.target.value } }))} /></section>;
  const reading = <div className="reading-source">Further reading: <a href="https://www.microsoft.com/en-us/research/group/experimentation-platform-exp/" target="_blank" rel="noreferrer">Microsoft Experimentation Platform ↗</a><a href="https://www.itl.nist.gov/div898/handbook/" target="_blank" rel="noreferrer">NIST statistical handbook ↗</a></div>;
  const nextLink = <div className="lesson-next"><Link href={next ? experimentUrl(next) : "/journal"}><div><span className="micro">{next ? `NEXT STOP · ${next.id}` : "JOURNEY COMPLETE"}</span><h3>{next ? next.title : "Look back at your learning journal"}</h3></div><ArrowRight size={20} /></Link></div>;
  const title = lesson && <div className="lesson-title-column"><div className="sticky-lesson-title"><span className="eyebrow">PART {parts[lesson.part].roman} · {parts[lesson.part].name} · CONCEPT {lesson.id} OF {lessons.length}</span><h1>{lesson.heading}</h1><div className="lesson-status"><span className="part-tag">{understood ? "UNDERSTOOD" : "EXPLORE"}</span><span>~{lesson.minutes} min</span></div>{completion}<Link className="back-to-map" href="/experimentation#route-map"><ArrowLeft size={12} />Back to journey</Link></div></div>;
  return <div className={`learning-shell experiment-shell ${desktopHidden ? "contents-hidden" : ""}`}>
    <header className="learning-header"><button className="contents-button" aria-controls="experimentation-contents" aria-expanded={isMobile ? sidebarOpen : !desktopHidden} onClick={() => isMobile ? setSidebarOpen(!sidebarOpen) : setDesktopHidden(!desktopHidden)}><Menu size={15} />Contents</button><JourneyLinks active="experimentation" /><DisplayControls /><div className="header-arrows"><Link className="icon-button" aria-label="Previous stop" href={prev ? experimentUrl(prev) : "/experimentation"}><ArrowLeft size={15} /></Link><Link className="icon-button" aria-label="Next stop" href={next ? experimentUrl(next) : lesson ? "/journal" : experimentUrl(lessons[0])}><ArrowRight size={15} /></Link></div></header>
    {sidebarOpen && <button className="sidebar-overlay" aria-label="Close contents" onClick={() => setSidebarOpen(false)} />}
    <aside id="experimentation-contents" className={`learning-sidebar ${sidebarOpen ? "open" : ""}`}><div className="sidebar-top"><div className="sidebar-caption"><span className="micro">YOUR LEARNING JOURNEY</span><button className="icon-button sidebar-close" aria-label="Close contents" onClick={() => setSidebarOpen(false)}><X size={15} /></button></div><Link href="/experimentation" className="sidebar-title">Experimentation</Link><div className="sidebar-progress"><div><i style={{ width: `${progress.understood.length / lessons.length * 100}%` }} /></div><span>{progress.understood.length} / {lessons.length} understood</span></div></div>
      <nav className="contents-nav" aria-label="Experimentation contents"><Link className="map-link" href="/experimentation" onClick={() => setSidebarOpen(false)}>Journey overview</Link>{parts.map((part, i) => <details open key={part.name} className="sidebar-part" style={{ "--part-color": part.color } as React.CSSProperties}><summary className="experiment-part-toggle"><span className="part-dot" /><span>PART {part.roman} · {part.name}</span></summary><div className="part-lessons">{lessons.filter(l => l.part === i).map(l => <Link key={l.id} href={experimentUrl(l)} onClick={() => setSidebarOpen(false)} aria-current={lesson?.id === l.id ? "page" : undefined} className={`${lesson?.id === l.id ? "active" : ""} ${progress.understood.includes(l.id) ? "understood" : ""}`}><span className="lesson-dot">{progress.understood.includes(l.id) && <Check size={9} />}</span><span className="lesson-number">{String(l.id).padStart(2, "0")}</span>{l.title}</Link>)}</div></details>)}</nav>
      <div className="sidebar-bottom"><Link href="/journal">Learning journal ↗</Link><Link href="/">DSConcepts home ↗</Link></div>
    </aside>
    <main className="learning-main">{storageError && <p className="storage-warning" role="status">Browser storage is unavailable. Your work may not persist after you leave this page.</p>}
      {!lesson ? <div className="route-page"><section className="forecast-intro experiment-intro"><span className="eyebrow">NORTHSTAR LAB · JOURNEY 02</span><h1>Experimentation,<br /><span className="reference-underline">from change to evidence.</span></h1><div className="reference-intro-layout"><div className="reference-panel intro-panel"><h2>A faster store. But is it a better store?</h2><p>Northstar is a fictional Amazon-like marketplace. Its engineering team wants to ship a new product-page cache. Will it make shopping faster, help buyers complete purchases, and keep checkout reliable?</p><p>Follow one A/B test from a causal question to a rollout decision. The running example uses sticky buyer assignment, seven-day purchase conversion, latency diagnostics, and reliability guardrails. All numbers are constructed for learning—not Amazon results.</p><p className="journey-summary">{lessons.length} stops · {progress.understood.length} marked as understood · no prerequisites</p><Link className="button primary" href={experimentUrl(lessons[progress.lastLesson - 1])}>{progress.understood.length || progress.lastLesson > 1 ? "Continue experimentation" : "Start with why randomize"}<ArrowRight size={16} /></Link></div><div className="experiment-hero-art" aria-hidden="true"><span>ONE STORE. TWO EXPERIENCES.</span><div className="hero-split"><div>A<br /><small>Existing stack</small></div><i>↔</i><div>B<br /><small>New cache</small></div></div><p>Same kinds of buyers.<br />One deliberate difference.</p></div></div></section><JourneyParts parts={parts} lessons={lessons} base="experimentation" understood={progress.understood} /><div className="source-note"><p>Start with a fair comparison. Measure buyer benefit and operational safety separately. End with an honest decision—not a search for a green p-value.</p></div></div> : <article className="reference-lesson" style={{ "--part-color": parts[lesson.part].color } as React.CSSProperties}>
        {layout !== "lab" && title}
        {layout === "lab" ? <FocusLesson title={title} idea={lesson} teaching={teaching} guide={experimentGuide(lesson.lab)} lab={lab} check={quiz} notebook={notebook} reading={reading} next={nextLink} reset={reset} /> : <div className="lesson-content-panel"><p className="lesson-intro">{lesson.intro}</p><LessonConceptTables teaching={teaching!} />{lesson.formula && <div className="formula">{lesson.formula}</div>}<div className="lab-toolbar">{reset}</div>{lab}<RememberThis text={lesson.takeaway} />{quiz}{notebook}{reading}{nextLink}</div>}
      </article>}
      <footer className="learning-footer"><span>DSConcepts · one concept at a time.</span><Link href="/journal">Learning journal ↗</Link></footer>
    </main>
  </div>;
}

export function ExperimentJournal() {
  const { progress, ready, storageError } = useExperimentProgress();
  const visible = lessons.filter(l => progress.understood.includes(l.id) || progress.notes[l.id]?.trim());
  function exportNotes() {
    const text = `# DSConcepts — My Experimentation Journal\n\n${progress.understood.length}/${lessons.length} stops understood\n\n` + visible.map(l => `## ${l.id}. ${l.title}\n\n${progress.understood.includes(l.id) ? "Understood ✓\n\n" : ""}${progress.notes[l.id] || "No note yet."}\n`).join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "statsconcepts-experimentation-journal.md"; a.click(); URL.revokeObjectURL(url);
  }
  return <section className="experiment-journal"><span className="eyebrow">JOURNEY 02</span><h2>Experimentation journal</h2><p>{progress.understood.length} / {lessons.length} understood · stored separately from your forecasting notes</p>{storageError && <p className="storage-warning" role="status">Experimentation storage is unavailable. Notes may not persist.</p>}<button className="button secondary" disabled={!ready || !visible.length} onClick={exportNotes}><Download size={15} />Export experimentation notes</button>{visible.length ? <div className="journal-entries">{visible.map(l => <article key={l.id}><div className="journal-entry-meta"><span className="micro">STOP {l.id} · {parts[l.part].name}</span>{progress.understood.includes(l.id) && <span className="status">✓ UNDERSTOOD</span>}</div><Link href={experimentUrl(l)}><h3>{l.title}</h3><ArrowRight size={16} /></Link><p>{progress.notes[l.id] || "No note yet."}</p></article>)}</div> : <Link className="experiment-empty-link" href="/experimentation">Explore experimentation and add your first note →</Link>}</section>;
}
