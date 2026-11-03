import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = dirname(require.resolve("@duckdb/duckdb-wasm"));
const target = join(root, "public", "sql-engine");
await mkdir(target, { recursive: true });
for (const name of ["duckdb-mvp.wasm", "duckdb-eh.wasm", "duckdb-browser-mvp.worker.js", "duckdb-browser-eh.worker.js"]) {
  await copyFile(join(source, name), join(target, name));
}
console.log("Prepared local DuckDB worker and WASM assets.");
