"use client";

import Link from "next/link";
import { DisplayControls } from "./layout-preference";

export function Logo() {
  return <Link className="logo" href="/" aria-label="DSConcepts home"><span className="logo-mark" aria-hidden="true">DS</span>DSConcepts</Link>;
}

export function Header() {
  return <header className="site-header"><div className="header-inner">
    <Logo />
    <nav aria-label="Main navigation">
      <Link href="/">Home</Link>
      <Link href="/#journeys">Concepts</Link>
      <Link href="/sql-practice">SQL Practice</Link>
    </nav>
    <Link className="journal-link" href="/journal">Learning journal</Link>
    <DisplayControls />
  </div></header>;
}

export function ForecastSketch({ components = false }: { components?: boolean }) {
  if (components) return <svg className="concept-sketch" viewBox="0 0 320 220" fill="none" aria-hidden="true">
    <g stroke="var(--ink)" strokeWidth="1.5">
      <rect x="15" y="25" width="75" height="75" rx="6" fill="var(--lime)" />
      <rect x="120" y="25" width="75" height="75" rx="6" fill="var(--green)" />
      <rect x="225" y="25" width="75" height="75" rx="6" strokeDasharray="5 4" />
      <path d="M90 62H120M195 62H225M26 83L44 64L57 72L79 44M132 83Q157 20 183 83M244 63H281M263 45V82" />
      <path d="M15 161C64 141 95 192 153 169S244 132 297 166" />
      <circle cx="163" cy="165" r="5" fill="var(--green)" />
    </g>
  </svg>;
  return <svg className="forecast-sketch" viewBox="0 0 340 240" fill="none" aria-hidden="true">
    <g stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M19 157C45 145 51 164 72 139S103 153 123 119S153 136 177 105" />
      <path d="M177 105L316 17V190Z" fill="var(--lime)" />
      <path d="M177 105L316 60V147Z" fill="var(--green)" />
      <path d="M177 105L316 101" strokeDasharray="5 5" />
      <circle cx="177" cy="105" r="5" fill="var(--green)" />
      <path d="M18 207H318M177 202V213" />
    </g>
    <text x="177" y="233" textAnchor="middle" fill="var(--ink)" fontSize="11" fontFamily="var(--mono)">TODAY</text>
  </svg>;
}
