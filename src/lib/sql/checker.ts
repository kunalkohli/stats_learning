export type SqlCell = string | number | boolean | null;
export type SqlResult = { columns: string[]; rows: SqlCell[][]; truncated: boolean };
export type CheckResult = { correct: boolean; message: string; missing: SqlCell[][]; extra: SqlCell[][] };
const encodeCell = (value: SqlCell) => typeof value === "number" ? ["number", Number(value.toFixed(8))] : [typeof value, value];
const rowKey = (row: SqlCell[]) => JSON.stringify(row.map(encodeCell));

/** Result-based grading: alias-aware columns, typed cells, and duplicate-preserving bags. */
export function compareResults(actual: SqlResult, expected: SqlResult, ordered: boolean): CheckResult {
  const fail = (message: string, missing: SqlCell[][] = [], extra: SqlCell[][] = []): CheckResult => ({ correct: false, message, missing, extra });
  if (actual.truncated) return fail("Your result exceeds the 500-row limit. Check the intended grain, filters, and joins.");
  const names = actual.columns.map(c => c.toLowerCase()), target = expected.columns.map(c => c.toLowerCase());
  if (names.length !== target.length || new Set(names).size !== names.length || target.some(c => !names.includes(c))) return fail(`Expected columns: ${expected.columns.join(", ")}. Use these output aliases; column order may differ.`);
  const positions = target.map(c => names.indexOf(c));
  const rows = actual.rows.map(row => positions.map(i => row[i]));
  if (ordered && rows.length === expected.rows.length && rows.every((row, i) => rowKey(row) === rowKey(expected.rows[i]))) return { correct: true, message: "Result and required row order match.", missing: [], extra: [] };
  const remaining = new Map<string, { count: number; row: SqlCell[] }>();
  for (const row of expected.rows) { const key = rowKey(row), entry = remaining.get(key); remaining.set(key, { count: (entry?.count ?? 0) + 1, row }); }
  const extra: SqlCell[][] = [];
  for (const row of rows) { const entry = remaining.get(rowKey(row)); if (entry && entry.count > 0) entry.count--; else extra.push(row); }
  const missing = [...remaining.values()].flatMap(entry => Array.from({ length: entry.count }, () => entry.row));
  if (extra.length || missing.length) return fail(`Expected ${expected.rows.length} rows; got ${rows.length}. ${missing.length} missing and ${extra.length} unexpected rows (duplicates count).`, missing.slice(0, 5), extra.slice(0, 5));
  if (ordered) return fail("The rows match, but their order does not. Apply the sorting requested in the question.");
  return { correct: true, message: "Columns and rows match, including duplicate counts.", missing: [], extra: [] };
}

/** One SELECT/WITH only. The engine also wraps it as a subquery, so DDL/DML cannot execute. */
export function readOnlyQuery(source: string): string {
  if (!source.trim()) throw new Error("Write a SELECT query before running it.");
  if (source.length > 20000) throw new Error("Keep the query under 20,000 characters.");
  const tokens: string[] = [];
  let i = 0, semicolon = -1;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) { i++; continue; }
    if (source.startsWith("--", i)) { const end = source.indexOf("\n", i); i = end < 0 ? source.length : end + 1; continue; }
    if (source.startsWith("/*", i)) {
      let depth = 1; i += 2;
      while (i < source.length && depth) { if (source.startsWith("/*", i)) { depth++; i += 2; } else if (source.startsWith("*/", i)) { depth--; i += 2; } else i++; }
      if (depth) throw new Error("Close the /* block comment */ before running.");
      continue;
    }
    if (semicolon >= 0) throw new Error("Run one SELECT or WITH query at a time. Multiple statements are not allowed.");
    if (c === ";") { semicolon = i++; continue; }
    if (c === "'" || c === '"') {
      const quote = c; let closed = false; i++;
      while (i < source.length) { if (source[i++] === quote) { if (source[i] === quote) i++; else { closed = true; break; } } }
      if (!closed) throw new Error("Close the quoted string or identifier before running.");
      if (tokens.length === 0) tokens.push("QUOTED");
      continue;
    }
    const dollar = c === "$" ? source.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/)?.[0] : undefined;
    if (dollar) { const end = source.indexOf(dollar, i + dollar.length); if (end < 0) throw new Error("Close the dollar-quoted string."); i = end + dollar.length; continue; }
    const word = source.slice(i).match(/^[A-Za-z_][A-Za-z0-9_$]*/)?.[0];
    if (word) { tokens.push(word.toUpperCase()); i += word.length; } else { if (!tokens.length) tokens.push("OTHER"); i++; }
  }
  if (!["SELECT", "WITH"].includes(tokens[0])) throw new Error("This practice database is read-only. Start with SELECT or WITH.");
  const forbidden = new Set(["INSERT", "UPDATE", "DELETE", "CREATE", "DROP", "ALTER", "TRUNCATE", "COPY", "ATTACH", "DETACH", "INSTALL", "LOAD", "PRAGMA", "CALL", "SET", "RESET", "BEGIN", "COMMIT", "ROLLBACK", "EXPORT", "IMPORT", "MERGE", "VACUUM", "QUERY"]);
  const blocked = tokens.find(t => forbidden.has(t));
  if (blocked) throw new Error(`${blocked} is not available in the read-only practice sandbox. Use one SELECT or WITH query.`);
  return (semicolon < 0 ? source : source.slice(0, semicolon)).trimEnd() + "\n";
}
