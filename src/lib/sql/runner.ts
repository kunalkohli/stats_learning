import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { fixtureSql } from "./data";
import { compareResults, readOnlyQuery, type CheckResult, type SqlCell, type SqlResult } from "./checker";
import type { SqlQuestion } from "./questions";

const ROW_LIMIT = 500;
export type Execution = { result?: SqlResult; expected?: SqlResult; feedback?: CheckResult; expectedOnly: boolean; milliseconds: number };

/** One private, worker-backed, in-memory database per workspace; never a server database. */
export class SqlRunner {
  private db?: AsyncDuckDB;
  private connection?: AsyncDuckDBConnection;
  private worker?: Worker;
  private initializing?: Promise<void>;
  private abort?: (error: Error) => void;
  private epoch = 0;
  private busy = false;

  private async initialize() {
    if (this.connection) return;
    if (this.initializing) return this.initializing;
    const epoch = this.epoch;
    this.initializing = (async () => {
      const duckdb = await import("@duckdb/duckdb-wasm");
      if (epoch !== this.epoch) throw new Error("Query cancelled.");
      const bundle = await duckdb.selectBundle({
        mvp: { mainModule: "/sql-engine/duckdb-mvp.wasm", mainWorker: "/sql-engine/duckdb-browser-mvp.worker.js" },
        eh: { mainModule: "/sql-engine/duckdb-eh.wasm", mainWorker: "/sql-engine/duckdb-browser-eh.worker.js" },
      });
      if (epoch !== this.epoch) throw new Error("Query cancelled.");
      const worker = new Worker(bundle.mainWorker!);
      this.worker = worker;
      const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
      this.db = db;
      await db.instantiate(bundle.mainModule);
      await db.open({ maximumThreads: 1, query: { castBigIntToDouble: true, castDecimalToDouble: true, castTimestampToDate: true } });
      this.connection = await db.connect();
      await this.connection.query("SET enable_external_access = false; SET autoinstall_known_extensions = false; SET autoload_known_extensions = false; SET memory_limit = '128MB'; SET threads = 1; SET lock_configuration = true;");
    })();
    try { await this.initializing; } finally { if (epoch === this.epoch) this.initializing = undefined; }
  }

  cancel(reason = new Error("Query cancelled. The worker was stopped; you can run again.")) {
    this.epoch++;
    this.worker?.terminate();
    this.worker = undefined; this.db = undefined; this.connection = undefined; this.initializing = undefined;
    const abort = this.abort; this.abort = undefined;
    abort?.(reason);
    this.busy = false;
  }

  private async bounded<T>(task: () => Promise<T>, ms: number, message: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const aborted = new Promise<never>((_, reject) => {
      this.abort = reject;
      timer = setTimeout(() => this.cancel(new Error(message)), ms);
    });
    try { return await Promise.race([task(), aborted]); }
    finally { if (timer) clearTimeout(timer); this.abort = undefined; }
  }

  private async seed(variation: boolean) {
    await this.connection!.query("DROP SCHEMA IF EXISTS practice CASCADE; CREATE SCHEMA practice;");
    // Qualify trusted fixture statements instead of changing locked connection settings.
    const seed = fixtureSql(variation).replaceAll(/CREATE TABLE (\w+)/g, "CREATE TABLE practice.$1").replaceAll(/INSERT INTO (\w+)/g, "INSERT INTO practice.$1");
    await this.connection!.query(seed);
  }

  private async query(source: string): Promise<SqlResult> {
    const query = readOnlyQuery(source);
    // The WITH context exposes only the six fixture tables. Outer SELECT enforces query context.
    const aliases = ["customers", "products", "orders", "order_items", "payments", "refunds"].map(name => `${name} AS (SELECT * FROM practice.${name})`).join(", ");
    const table = await this.connection!.query(`WITH ${aliases} SELECT * FROM (\n${query}\n) AS submitted LIMIT ${ROW_LIMIT + 1}`);
    const fields = table.schema.fields;
    const cell = (value: unknown, type: string): SqlCell => {
      if (value === null || value === undefined) return null;
      if (type.startsWith("Date")) return new Date(Number(value)).toISOString().slice(0, 10);
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "bigint") { const n = Number(value); if (!Number.isSafeInteger(n)) throw new Error("Integer exceeds the safe display range. Cast or aggregate it explicitly."); return n; }
      if (typeof value === "number") { if (!Number.isFinite(value)) throw new Error("Result contains a non-finite number. Check divisions and NULL handling."); return value; }
      if (typeof value === "boolean" || typeof value === "string") return value;
      throw new Error("Return scalar text, numbers, dates, or NULLs rather than nested lists or structs.");
    };
    const rows: SqlCell[][] = [];
    for (let i = 0; i < Math.min(table.numRows, ROW_LIMIT); i++) rows.push(fields.map((field, j) => cell(table.getChildAt(j)!.get(i), field.type.toString())));
    return { columns: fields.map(f => f.name), rows, truncated: table.numRows > ROW_LIMIT };
  }

  async execute(source: string, question?: SqlQuestion, expectedOnly = false): Promise<Execution> {
    readOnlyQuery(source);
    if (this.busy) throw new Error("A query is already running.");
    this.busy = true;
    const epoch = this.epoch, start = performance.now();
    try {
      await this.bounded(() => this.initialize(), 30000, "SQL engine startup timed out. Retry; engine assets are served locally.");
      return await this.bounded(async () => {
        await this.seed(false);
        const expected = question ? await this.query(question.solution) : undefined;
        const result = expectedOnly ? undefined : await this.query(source);
        let feedback = expected && result ? compareResults(result, expected, question!.ordered) : undefined;
        if (feedback?.correct) {
          await this.seed(true);
          const alternateExpected = await this.query(question!.solution), alternateActual = await this.query(source);
          const alternate = compareResults(alternateActual, alternateExpected, question!.ordered);
          feedback = alternate.correct ? { correct: true, message: "Correct on the visible dataset and an amount-variation fixture. This checks results, not your query text.", missing: [], extra: [] } : { correct: false, message: "The visible result matches, but the amount-variation fixture does not. Avoid hardcoded answer rows and check thresholds, first-order logic, and ties.", missing: [], extra: [] };
        }
        return { result, expected, feedback, expectedOnly, milliseconds: performance.now() - start };
      }, 5000, "Query exceeded 5 seconds and its worker was stopped. Simplify joins or recursion, then run again.");
    } catch (error) {
      // Recreate even after SQL errors so aborted work never contaminates a later run.
      if (epoch === this.epoch) this.cancel();
      throw error;
    } finally { if (epoch === this.epoch) this.busy = false; }
  }
}
