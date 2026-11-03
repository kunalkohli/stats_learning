"use client";

import { useState } from "react";
import type { SqlCell, SqlResult } from "@/lib/sql/checker";

const display = (cell: SqlCell) => cell === null ? "NULL" : cell === "" ? '""' : String(cell);
export function ResultsTable({ result, label = "Query results", compact = false }: { result: SqlResult; label?: string; compact?: boolean }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(result.rows.length / 25)), current = Math.min(page, pages - 1);
  return <div className="sql-results-table"><div className="sql-table-scroll" tabIndex={0} role="region" aria-label={`${label} scrollable table`}><table><caption className="sr-only">{label}</caption><thead><tr>{result.columns.map((c, i) => <th scope="col" key={`${i}-${c}`}>{c}</th>)}</tr></thead><tbody>{result.rows.slice(current * 25, current * 25 + 25).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} title={display(cell)}>{cell === null ? <em>NULL</em> : display(cell)}</td>)}</tr>)}</tbody></table>{!result.rows.length && <p className="sql-empty-results">Query succeeded. No rows returned.</p>}</div>{!compact && <div className="sql-result-pagination"><span>{result.rows.length}{result.truncated ? "+" : ""} rows · {result.columns.length} columns</span><div><button disabled={current === 0} onClick={() => setPage(current - 1)} aria-label={`Previous ${label} page`}>←</button><span>{current + 1} / {pages}</span><button disabled={current === pages - 1} onClick={() => setPage(current + 1)} aria-label={`Next ${label} page`}>→</button></div></div>}{result.truncated && <p className="sql-limit-warning">Output capped at 500 rows; truncated results cannot pass a check.</p>}</div>;
}
