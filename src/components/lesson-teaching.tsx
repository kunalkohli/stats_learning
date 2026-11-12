import type { LessonTeaching, LessonCaseStudy, TeachingTableData, BaselineRow } from "@/lib/lesson-teaching";
import { LessonCopy } from "./lesson-copy";

export function TeachingTable({ data }: { data: TeachingTableData }) {
  const first = data.firstColumn ?? "Concept", meaning = data.meaningColumn ?? "What it means";
  return <table className="lesson-table" role="table">
    <caption className="sr-only">{data.label}. Illustrative Northstar examples, not measured business results.</caption>
    <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">{first}</th><th scope="col" role="columnheader">{meaning}</th><th scope="col" role="columnheader">Northstar example</th></tr></thead>
    <tbody role="rowgroup">{data.rows.map(row => <tr key={row.concept} role="row"><th scope="row" role="rowheader"><span className="lesson-row-emoji" aria-hidden="true">{row.emoji}</span><span>{row.concept}</span></th><td role="cell" data-label={meaning}><LessonCopy text={row.meaning} /></td><td role="cell" data-label="Northstar example" className="lesson-example-cell"><LessonCopy text={row.example} prefix={<span aria-hidden="true">🛒 </span>} /></td></tr>)}</tbody>
  </table>;
}

export function LessonConceptTables({ teaching }: { teaching: LessonTeaching }) {
  return <div className="lesson-concept-tables">{teaching.baselineComparison ? <BaselineComparison rows={teaching.baselineComparison} /> : <TeachingTable data={teaching.overview ?? teaching.table} />}{teaching.secondary && <section className="lesson-secondary-table"><h2>{teaching.secondary.label}</h2><TeachingTable data={teaching.secondary} /></section>}</div>;
}

export function BaselineComparison({ rows }: { rows: BaselineRow[] }) {
  return <table className="lesson-table baseline-comparison" role="table"><caption className="sr-only">Five baseline forecasts: rules, assumptions, and Northstar examples</caption><thead role="rowgroup"><tr role="row">{["Baseline", "Forecast =", "Assumes", "Northstar example"].map(h => <th scope="col" role="columnheader" key={h}>{h}</th>)}</tr></thead><tbody role="rowgroup">{rows.map(row => <tr key={row.name} role="row"><th scope="row" role="rowheader"><span aria-hidden="true" className="lesson-row-emoji">{row.emoji}</span>{row.name}</th><td role="cell" data-label="Forecast =">{row.rule}</td><td role="cell" data-label="Assumes">{row.assumption}</td><td role="cell" data-label="Northstar example" className="lesson-example-cell"><LessonCopy text={row.example} prefix={<span aria-hidden="true">🛒 </span>} /></td></tr>)}</tbody></table>;
}

export function RememberThis({ text, formula, heading = true }: { text: string; formula?: string; heading?: boolean }) {
  return <aside className="remember-this" aria-label="Remember this">{heading && <h2><span className="remember-icon" aria-hidden="true">⭐</span>Remember this</h2>}<p className="remember-message">{text}</p>{formula && <div className="formula">{formula}</div>}</aside>;
}

export function LessonCase({ study }: { study: LessonCaseStudy }) {
  return <section className="lesson-case-study" aria-label="Northstar use case"><h2>{study.title}</h2><LessonCopy className="lesson-case-intro" text={study.description} /><table className="lesson-case-table" role="table"><caption className="sr-only">Northstar forecasting use case: the decision, forecast, assumptions, and action</caption><colgroup><col className="lesson-case-label-column" /><col /></colgroup><tbody role="rowgroup">{study.rows.map(row => <tr key={row.label} role="row"><th scope="row" role="rowheader"><span className="lesson-row-emoji" aria-hidden="true">{row.emoji}</span>{row.label}</th><td role="cell"><LessonCopy text={row.text} /></td></tr>)}</tbody></table></section>;
}
