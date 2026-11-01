"use client";

import Link from "next/link";

type Part = { name: string; roman: string; color: string; description: string; range: number[] };
type Stop = { id: number; title: string; part: number; slug: string };
export function JourneyParts({ parts, lessons, base, understood }: { parts: Part[]; lessons: Stop[]; base: string; understood: number[] }) {
  return <section className="journey-part-grid" aria-label="Journey parts" id="route-map">{parts.map((part, i) => <article className="journey-part-card" key={part.name} style={{ "--part-color": part.color } as React.CSSProperties}>
    <span className="micro"><i />PART {part.roman} · {part.name}</span><h2>{part.description}</h2><div className="part-card-links">{lessons.filter(l => l.part === i).map(l => <Link href={`/${base}/${l.slug}`} key={l.id}><span>{understood.includes(l.id) ? "✓" : String(l.id).padStart(2, "0")}</span>{l.title}</Link>)}</div>
  </article>)}</section>;
}
