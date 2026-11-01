"use client";

import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";
import { lessons, parts } from "@/lib/curriculum";
import type { Progress } from "./progress";

const positions = lessons.map((_, i) => {
  const row = Math.floor(i / 6), col = i % 6;
  return { x: 100 + (row % 2 ? 5 - col : col) * 180, y: 90 + row * 165 };
});

export function RouteMap({ progress }: { progress: Progress }) {
  return <section className="route-map-section" id="route-map">
    <div className="route-section-heading"><span className="eyebrow">{lessons.length} CONNECTED STOPS</span><h2>The route map.</h2><p>Follow the line, or choose any stop.</p></div>
    <div className="route-map-paper">
      <svg className="route-map-svg" viewBox={`0 0 1120 ${Math.ceil(lessons.length / 6) * 165 + 40}`} aria-label={`Forecasting journey: ${lessons.length} linked stops`} role="group">
        <title>Forecasting journey route map</title>
        {positions.slice(0, -1).map((p, i) => {
          const n = positions[i + 1], part = parts[lessons[i].part];
          const sameRow = p.y === n.y;
          const bend = p.x > 500 ? p.x + 100 : p.x - 100;
          const path = sameRow ? `M${p.x},${p.y}L${n.x},${n.y}` : `M${p.x},${p.y}C${bend},${p.y} ${bend},${n.y} ${n.x},${n.y}`;
          return <path key={i} d={path} fill="none" stroke={part.color} strokeWidth="3" />;
        })}
        {parts.map((p, i) => {
          const position = positions[p.range[0] - 1];
          return <g key={p.name} transform={`translate(${Math.min(position.x - 18, 888)}, ${position.y - 59})`}><rect width="155" height="23" rx="12" fill={p.color} /><text x="77.5" y="15.5" textAnchor="middle" fontSize="10" fill="#f3f3eb" fontFamily="var(--mono)">PART {p.roman} · {p.name.toUpperCase()}</text></g>;
        })}
        {lessons.map((l, i) => {
          const p = positions[i], complete = progress.understood.includes(l.id);
          const words = l.title.split(" ");
          const lines: string[] = [];
          for (const word of words) {
            if (!lines.length || `${lines[lines.length - 1]} ${word}`.length > 22) lines.push(word);
            else lines[lines.length - 1] += ` ${word}`;
          }
          return <Link href={`/forecasting/${l.slug}`} key={l.id} className="map-svg-link" aria-label={`Stop ${l.id}: ${l.title}${complete ? ", understood" : ""}`}>
            <g transform={`translate(${p.x},${p.y})`}>
              <circle className="map-hit" r="29" fill="transparent" />
              <circle r="16" fill={complete ? "var(--green)" : "var(--panel)"} stroke={parts[l.part].color} strokeWidth="2.5" />
              <text y="4" textAnchor="middle" fill="var(--ink)" fontSize="11" fontFamily="var(--sans)">{complete ? "✓" : String(l.id).padStart(2, "0")}</text>
              <text textAnchor="middle" fill="var(--ink)" fontSize="12" fontFamily="var(--sans)">{lines.map((line, j) => <tspan key={j} x="0" y={39 + j * 15}>{line}</tspan>)}</text>
            </g>
          </Link>;
        })}
      </svg>
      <div className="mobile-route-chapters">{parts.map((part, i) => <section key={part.name} className="mobile-route-part" style={{ "--part-color": part.color } as React.CSSProperties}>
        <h3><span className="part-dot" />PART {part.roman} · {part.name}</h3>
        {lessons.filter(l => l.part === i).map(l => <Link key={l.id} href={`/forecasting/${l.slug}`} className={`route-stop ${progress.understood.includes(l.id) ? "understood" : ""}`}>
          <span className="route-node">{progress.understood.includes(l.id) ? <Check size={15} /> : String(l.id).padStart(2, "0")}</span><span>{l.title}</span><small>{l.minutes} min</small><ArrowUpRight size={14} />
        </Link>)}
      </section>)}</div>
    </div>
  </section>;
}
