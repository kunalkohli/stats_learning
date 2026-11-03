import type { LessonTeaching, LessonCaseStudy, TeachingTableData } from "@/lib/lesson-teaching";

export function TeachingTable({ data }: { data: TeachingTableData }) {
  const first = data.firstColumn ?? "Concept", meaning = data.meaningColumn ?? "What it means";
  return <table className="lesson-table" role="table">
    <caption className="sr-only">{data.label}. Illustrative Northstar examples, not measured business results.</caption>
    <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">{first}</th><th scope="col" role="columnheader">{meaning}</th><th scope="col" role="columnheader">Northstar example</th></tr></thead>
    <tbody role="rowgroup">{data.rows.map(row => <tr key={row.concept} role="row"><th scope="row" role="rowheader"><span className="lesson-row-emoji" aria-hidden="true">{row.emoji}</span><span>{row.concept}</span></th><td role="cell" data-label={meaning}>{row.meaning}</td><td role="cell" data-label="Northstar example" className="lesson-example-cell">{row.example}</td></tr>)}</tbody>
  </table>;
}

export function LessonConceptTables({ teaching }: { teaching: LessonTeaching }) {
  return <div className="lesson-concept-tables"><TeachingTable data={teaching.table} />{teaching.secondary && <section className="lesson-secondary-table"><h2>{teaching.secondary.label}</h2><TeachingTable data={teaching.secondary} /></section>}</div>;
}

export function LessonCase({ study }: { study: LessonCaseStudy }) {
  return <section className="lesson-case-study" aria-label="Northstar use case"><h2>{study.title}</h2><p>{study.description}</p><table className="lesson-case-table" role="table"><caption className="sr-only">Northstar forecasting use case: the decision, forecast, assumptions, and action</caption><colgroup><col className="lesson-case-label-column" /><col /></colgroup><tbody role="rowgroup">{study.rows.map(row => <tr key={row.label} role="row"><th scope="row" role="rowheader"><span className="lesson-row-emoji" aria-hidden="true">{row.emoji}</span>{row.label}</th><td role="cell">{row.text}</td></tr>)}</tbody></table></section>;
}
