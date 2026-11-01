"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_TEXT_SIZE, MIN_TEXT_SIZE, MAX_TEXT_SIZE, TEXT_SIZE_STEP, restoreTextSize } from "@/lib/display-preferences";

type Layout = "classic" | "lab";
const LayoutContext = createContext<{ layout: Layout; setLayout: (layout: Layout) => void; textSize: number; setTextSize: (size: number) => void }>({ layout: "classic", setLayout: () => {}, textSize: DEFAULT_TEXT_SIZE, setTextSize: () => {} });

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setValue] = useState<Layout>("classic");
  const [textSize, setSize] = useState(DEFAULT_TEXT_SIZE);
  useEffect(() => {
    try { if (localStorage.getItem("statsconcepts-layout") === "lab") setValue("lab"); } catch { /* Preference is optional. */ }
    try { setSize(restoreTextSize(localStorage.getItem("statsconcepts-text-size"))); } catch { /* Default still works. */ }
  }, []);
  useEffect(() => { document.documentElement.dataset.layout = layout; }, [layout]);
  useEffect(() => {
    document.documentElement.style.fontSize = `${textSize}%`;
    document.documentElement.style.setProperty("--text-scale", String(textSize / 100));
  }, [textSize]);
  function setLayout(next: Layout) {
    setValue(next);
    try { localStorage.setItem("statsconcepts-layout", next); } catch { /* Still usable for this session. */ }
  }
  function setTextSize(size: number) {
    const next = restoreTextSize(size);
    setSize(next);
    try { localStorage.setItem("statsconcepts-text-size", String(next)); } catch { /* Still works for this session. */ }
  }
  return <LayoutContext.Provider value={{ layout, setLayout, textSize, setTextSize }}>{children}</LayoutContext.Provider>;
}

export const useLayoutPreference = () => useContext(LayoutContext);

export function LayoutSwitch() {
  const { layout, setLayout } = useLayoutPreference();
  return <div className="layout-switch" role="group" aria-label="Page layout">
    <span>Layout</span>
    <button aria-pressed={layout === "classic"} onClick={() => setLayout("classic")}>Classic</button>
    <button aria-pressed={layout === "lab"} onClick={() => setLayout("lab")}>Lab</button>
  </div>;
}

export function JourneyLinks({ active }: { active: "forecasting" | "experimentation" }) {
  return <nav className="journey-links" aria-label="Journeys"><Link className="workspace-brand" href="/" aria-label="StatsConcepts home"><span className="logo-mark" aria-hidden="true">SC</span><span className="workspace-name">StatsConcepts</span></Link><Link href="/">Home</Link><Link href="/forecasting" aria-current={active === "forecasting" ? "page" : undefined}>Forecasting</Link><Link href="/experimentation" aria-current={active === "experimentation" ? "page" : undefined}>Experimentation</Link></nav>;
}

export function TextSizeControls() {
  const { textSize, setTextSize } = useLayoutPreference();
  return <div className="text-size-controls" role="group" aria-label="Text size">
    <button aria-label="Decrease text size" title="Decrease text size" disabled={textSize === MIN_TEXT_SIZE} onClick={() => setTextSize(textSize - TEXT_SIZE_STEP)}>A−</button>
    <button className="text-size-value" aria-label="Reset text size to 90%" title="Reset text size to 90%" onClick={() => setTextSize(DEFAULT_TEXT_SIZE)}><span aria-live="polite">{textSize}%</span></button>
    <button aria-label="Increase text size" title="Increase text size" disabled={textSize === MAX_TEXT_SIZE} onClick={() => setTextSize(textSize + TEXT_SIZE_STEP)}>A+</button>
  </div>;
}

export function DisplayControls() {
  return <div className="display-controls"><TextSizeControls /><LayoutSwitch /></div>;
}
