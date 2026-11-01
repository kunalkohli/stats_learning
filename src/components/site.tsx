"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowRight, ArrowLeft, BookOpen, Check, ChevronDown, ChevronRight, Clock3, Menu, Route, X, CheckCircle2, Download, Circle, PenLine } from "lucide-react";
import { lessons, parts, type Lesson } from "@/lib/curriculum";
import { useProgress, type Progress } from "./progress";
import { Lab, ResetLabButton } from "./labs";
import { Header, ForecastSketch } from "./chrome";
import { RouteMap } from "./route-map";
import { JourneyLinks, DisplayControls, useLayoutPreference } from "./layout-preference";
import { FocusLesson } from "./focus-lesson";
import { JourneyParts } from "./journey-parts";
import { ExperimentJournal } from "./experimentation";
export { Home } from "./home";

export const lessonUrl = (lesson: Lesson) => `/forecasting/${lesson.slug}`;

function Sidebar({ active, progress, onClose }: { active: number | "map"; progress: Progress; onClose: () => void }) {
  const currentPart = typeof active === "number" ? lessons[active - 1].part : 0;
  const [expanded, setExpanded] = useState<number[]>([currentPart]);
  const [onlyCurrent, setOnlyCurrent] = useState(false);
  return <>
    <div className="sidebar-top">
      <div className="sidebar-caption"><span className="micro">ON THIS PAGE</span><button className="icon-button sidebar-close" aria-label="Close contents" onClick={onClose}><X size={17} /></button></div>
      <Link className="sidebar-title" href="/forecasting">Forecasting</Link>
      <div className="sidebar-progress"><div><i style={{ width: `${progress.understood.length / lessons.length * 100}%` }} /></div><span>{progress.understood.length} / {lessons.length} understood</span></div>
      <button className={`toggle ${onlyCurrent ? "on" : ""}`} aria-pressed={onlyCurrent} onClick={() => setOnlyCurrent(!onlyCurrent)}><span />Only show current part</button>
    </div>
    <nav className="contents-nav" aria-label="Forecasting contents">
      <Link onClick={onClose} className="map-link" href="/forecasting#start"><Circle size={12} />Start here</Link>
      <Link onClick={onClose} className={`map-link ${active === "map" ? "active" : ""}`} href="/forecasting#route-map"><Circle size={12} />Route map</Link>
      {parts.map((part, i) => (!onlyCurrent || i === currentPart) && <div className="sidebar-part" key={part.name} style={{ "--part-color": part.color } as React.CSSProperties}>
        <button className="part-toggle" aria-expanded={expanded.includes(i)} onClick={() => setExpanded(p => p.includes(i) ? p.filter(v => v !== i) : [...p, i])}>
          <span className="part-dot" /><span><small>PART {part.roman}</small>{part.name}</span>
          <small>{progress.understood.filter(id => lessons[id - 1].part === i).length}/{part.range[1] - part.range[0] + 1}</small>
          {expanded.includes(i) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {expanded.includes(i) && <div className="part-lessons">{lessons.filter(l => l.part === i).map(l => <Link onClick={onClose} href={lessonUrl(l)} key={l.id} aria-current={active === l.id ? "page" : undefined} className={`${active === l.id ? "active" : ""} ${progress.understood.includes(l.id) ? "understood" : ""}`}>
          <span className="lesson-dot">{progress.understood.includes(l.id) && <Check size={9} />}</span><span className="lesson-number">{String(l.id).padStart(2, "0")}</span>{l.title}
        </Link>)}</div>}
      </div>)}
    </nav>
    <div className="sidebar-bottom">
      <div className="sidebar-legend"><span><Circle size={12} />To explore</span><span><CheckCircle2 size={12} />Understood</span></div>
      <Link href="/journal"><PenLine size={14} />Learning journal</Link>
      <Link href="/">StatsConcepts home <ArrowUpRight size={13} /></Link>
    </div>
  </>;
}

export function Forecasting({ lesson }: { lesson?: Lesson }) {
  const { layout } = useLayoutPreference();
  const { progress, ready, storageError, update } = useProgress();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopHidden, setDesktopHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [labKey, setLabKey] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (ready && lesson) {
      setNote(progress.notes[lesson.id] || "");
      if (progress.lastLesson !== lesson.id) update(p => ({ ...p, lastLesson: lesson.id }));
    }
  }, [ready, lesson?.id]);
  const understood = lesson && progress.understood.includes(lesson.id);
  const next = lesson && lessons[lesson.id];
  const prev = lesson && lessons[lesson.id - 2];
  function toggleUnderstood() {
    if (lesson) update(p => ({ ...p, understood: p.understood.includes(lesson.id) ? p.understood.filter(id => id !== lesson.id) : [...p.understood, lesson.id] }));
  }
  function toggleContents() {
    if (window.matchMedia("(max-width: 760px)").matches) setSidebarOpen(!sidebarOpen);
    else setDesktopHidden(!desktopHidden);
  }
  const completionButton = <button disabled={!ready} className={`button ${understood ? "completed" : "secondary"}`} aria-pressed={!!understood} onClick={toggleUnderstood}>
    {understood ? <CheckCircle2 size={16} /> : <Circle size={15} />}{understood ? "Marked as understood" : "Mark as understood"}
  </button>;
  const quiz = lesson && <section className="quiz">
    <span className="micro">CHECK YOURSELF · CHOOSE AN ANSWER</span><h3>{lesson.question}</h3>
    <div className="quiz-options">{lesson.choices.map((c, i) => <button key={c} onClick={() => setChoice(i)} aria-pressed={choice === i} className={choice === i ? i === lesson.correct ? "correct" : "incorrect" : ""}><span>{choice === i ? i === lesson.correct ? <Check size={16} /> : <X size={16} /> : String.fromCharCode(65 + i)}</span>{c}</button>)}</div>
    {choice !== null && <div className={`quiz-answer ${choice === lesson.correct ? "correct" : ""}`} role="status"><strong>{choice === lesson.correct ? "That’s the idea." : "Not quite—here’s the distinction."}</strong><p>{lesson.answer}</p></div>}
  </section>;
  const notebook = lesson && <section className="personal-note"><div><PenLine size={17} /><h3>Your learning note</h3><span>{note ? storageError ? "Not saved" : "Saved in this browser" : "Private · just for you"}</span></div>
    <label className="sr-only" htmlFor="lesson-note">Your note for {lesson.title}</label><textarea id="lesson-note" disabled={!ready} value={note} placeholder="An idea to remember, a question, or a connection to your work…" onChange={e => { setNote(e.target.value); update(p => ({ ...p, notes: { ...p.notes, [lesson.id]: e.target.value } })); }} />
  </section>;
  const reading = lesson && <div className="reading-source"><BookOpen size={15} /><span>Further reading: <a href={`https://otexts.com/fpp3/${lesson.source}`} target="_blank" rel="noreferrer">Forecasting: Principles and Practice, 3rd ed. <ArrowUpRight size={12} /></a></span></div>;
  const nextLink = <div className="lesson-next"><Link href={next ? lessonUrl(next) : "/journal"}><div><span className="micro">{next ? `NEXT STOP · ${String(next.id).padStart(2, "0")}` : "JOURNEY COMPLETE"}</span><h3>{next ? next.title : "Look back at your learning journal"}</h3></div><ArrowRight size={21} /></Link></div>;
  const title = lesson && <div className="lesson-title-column"><div className="sticky-lesson-title">
    <span className="eyebrow">STOP {String(lesson.id).padStart(2, "0")} · {parts[lesson.part].name}</span><h1>{lesson.heading}</h1>
    <div className="lesson-status"><span className="part-tag">{understood ? "UNDERSTOOD" : "EXPLORE"}</span><span>~{lesson.minutes} min</span></div>{completionButton}
    <Link className="back-to-map" href="/forecasting#route-map"><ArrowLeft size={13} />Back to route map</Link>
  </div></div>;
  return <div className={`learning-shell ${desktopHidden ? "contents-hidden" : ""}`}>
    <header className="learning-header">
      <button className="contents-button" onClick={toggleContents} aria-expanded={isMobile ? sidebarOpen : !desktopHidden} aria-controls="forecasting-contents"><Menu size={16} />Contents</button>
      <JourneyLinks active="forecasting" />
      <div className="learning-breadcrumb"><Link href="/forecasting">{lesson ? `STOP ${String(lesson.id).padStart(2, "0")} / ${lessons.length}` : "FORECASTING"}</Link><span>{lesson ? lesson.heading : "Start at the route map, or jump to any stop"}</span></div>
      <DisplayControls />
      <div className="header-arrows"><Link aria-label="Previous stop" className="icon-button" href={prev ? lessonUrl(prev) : "/"}><ArrowLeft size={16} /></Link><Link aria-label="Next stop" className="icon-button" href={next ? lessonUrl(next) : lesson ? "/journal" : lessonUrl(lessons[0])}><ArrowRight size={16} /></Link></div>
    </header>
    {sidebarOpen && <button className="sidebar-overlay" aria-label="Close contents" onClick={() => setSidebarOpen(false)} />}
    <aside id="forecasting-contents" className={`learning-sidebar ${sidebarOpen ? "open" : ""}`}><Sidebar active={lesson?.id ?? "map"} progress={progress} onClose={() => setSidebarOpen(false)} /></aside>
    <main className="learning-main">
      {storageError && <p className="storage-warning" role="status">Browser storage is unavailable. Your work may not persist after you leave this page.</p>}
      {!lesson ? <ForecastIntro progress={progress} /> : <article className="reference-lesson" style={{ "--part-color": parts[lesson.part].color } as React.CSSProperties}>
        {layout !== "lab" && title}
        {layout === "lab" ? <FocusLesson title={title} idea={lesson} lab={<Lab key={labKey} lesson={lesson} />} check={quiz} notebook={notebook} reading={reading} next={nextLink} reset={<ResetLabButton onClick={() => setLabKey(k => k + 1)} />} /> : <div className="lesson-content-panel">
          <p className="lesson-intro">{lesson.intro}</p>
          <div className="idea-points">{lesson.points.map(p => <div className="idea-point" key={p.title}><div><h3>{p.title}</h3><p>{p.text}</p></div></div>)}</div>
          {lesson.formula && <div className="formula">{lesson.formula}</div>}
          <div className="lab-toolbar"><ResetLabButton onClick={() => setLabKey(k => k + 1)} /></div>
          <Lab key={labKey} lesson={lesson} />
          <aside className="takeaway"><div><span className="micro">TAKEAWAY</span><p>{lesson.takeaway}</p></div></aside>
          {quiz}{notebook}{reading}{nextLink}
        </div>}
      </article>}
      <footer className="learning-footer"><span>StatsConcepts · one concept at a time.</span><a href="/journal">Learning journal ↗</a></footer>
    </main>
  </div>;
}

function ForecastIntro({ progress }: { progress: Progress }) {
  const { layout } = useLayoutPreference();
  return <div className="route-page">
    <section className="forecast-intro" id="start">
      <h1>Forecasting,<br /><span className="reference-underline">one idea at a time.</span></h1>
      <div className="reference-intro-layout">
        <div className="reference-panel intro-panel">
          <h2>A journey from “what is a forecast?” to the models people actually use.</h2>
          <p>Each stop covers one concept. You read the idea, play with a diagram until it clicks, take away one line, and check yourself with a question.</p>
          <ul>
            <li><strong>One running example.</strong> Northstar, an ecommerce company. We forecast daily sales: weekly shopping patterns, year-round growth, and a Black Friday peak whose date moves every year.</li>
            <li><strong>Everything is simulated.</strong> We know the true answer behind each diagram, so you can see exactly what a method gets right and wrong.</li>
            <li><strong>Built in order.</strong> Later stops lean on earlier ones. Jump around if you like, but the route is the fastest way through.</li>
          </ul>
          <p className="journey-summary">{lessons.length} stops · {progress.understood.length} marked as understood</p>
          <Link className="button primary" href={lessonUrl(lessons[progress.lastLesson - 1])}>{progress.understood.length ? "Continue learning" : "Take the first step"}<ArrowRight size={18} /></Link>
        </div>
        <div className="reference-hero-art"><ForecastSketch /></div>
      </div>
    </section>
    {layout === "lab" ? <JourneyParts parts={parts} lessons={lessons} base="forecasting" understood={progress.understood} /> : <RouteMap progress={progress} />}
    <div className="source-note"><BookOpen size={21} /><div><strong>Go deeper with FPP3.</strong><p>Original ecommerce examples and teaching diagrams, informed by Hyndman & Athanasopoulos’s <a href="https://otexts.com/fpp3/" target="_blank" rel="noreferrer">Forecasting: Principles and Practice (3rd ed.)</a>. Each stop links to further reading. These are learning tools, not production model fits.</p></div></div>
  </div>;
}

export function Journal() {
  const { progress, ready, storageError } = useProgress();
  const [filter, setFilter] = useState("all");
  const noted = lessons.filter(l => progress.notes[l.id]?.trim());
  const visible = filter === "notes" ? noted : lessons.filter(l => progress.understood.includes(l.id) || progress.notes[l.id]?.trim());
  function exportNotes() {
    const content = `# StatsConcepts — My Forecasting Journal\n\n${progress.understood.length}/${lessons.length} stops understood\n\n` + lessons.filter(l => progress.understood.includes(l.id) || progress.notes[l.id]?.trim()).map(l => `## ${l.id}. ${l.title}\n\n${progress.understood.includes(l.id) ? "Understood ✓\n\n" : ""}${progress.notes[l.id] || "No note yet."}\n`).join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "statsconcepts-forecasting-journal.md"; a.click(); URL.revokeObjectURL(url);
  }
  return <><Header /><main className="journal-page">
    <span className="eyebrow">NOTES, QUESTIONS, AND IDEAS THAT CLICKED</span><h1>Your learning<br /><span className="reference-underline">journal.</span></h1><p>Ideas you’ve made sense of. Connections you don’t want to lose.</p>
    {storageError && <p className="storage-warning">Browser storage is unavailable. Notes may not persist.</p>}
    <div className="journal-summary">
      <div><Route size={23} /><strong>{progress.understood.length}<small>/{lessons.length}</small></strong><span>stops understood</span></div>
      <div><PenLine size={23} /><strong>{noted.length}</strong><span>personal notes</span></div>
      <button className="button secondary" disabled={!ready || !visible.length} onClick={exportNotes}><Download size={16} />Export as Markdown</button>
    </div>
    <div className="journal-filters"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All progress</button><button className={filter === "notes" ? "active" : ""} onClick={() => setFilter("notes")}>With notes</button><span>Saved only in this browser · no account required</span></div>
    {visible.length ? <div className="journal-entries">{visible.map(l => <article key={l.id}>
      <div className="journal-entry-meta"><span className="micro">STOP {String(l.id).padStart(2, "0")} · {parts[l.part].name}</span>{progress.understood.includes(l.id) && <span className="status"><CheckCircle2 size={13} />UNDERSTOOD</span>}</div>
      <Link href={lessonUrl(l)}><h2>{l.title}</h2><ArrowUpRight size={20} /></Link>
      {progress.notes[l.id] ? <p>{progress.notes[l.id]}</p> : <p className="no-note">No note yet. Revisit this stop to add your thoughts.</p>}
    </article>)}</div> : <div className="empty-journal"><BookOpen size={35} strokeWidth={1.2} /><h2>{filter === "notes" ? "Your next idea belongs here." : "A fresh page. A good place to start."}</h2><p>Write a note or mark an idea as understood in any lesson.<br />It will find its way here.</p><Link href="/forecasting" className="button primary">Explore forecasting<ArrowRight size={17} /></Link></div>}
    <p className="journal-privacy">Your notes live in your browser’s local storage. Export a copy to keep them safe. Clearing site data or switching browsers won’t carry them over.</p>
    <ExperimentJournal />
  </main></>;
}
