import { test } from "node:test";
import assert from "node:assert/strict";
import { createFixture, fixtureSql } from "../src/lib/sql/data";
import { sqlQuestions } from "../src/lib/sql/questions";
import { compareResults, readOnlyQuery, type SqlResult } from "../src/lib/sql/checker";
import { restoreSqlProgress } from "../src/lib/sql/progress";

const result = (rows: SqlResult["rows"], columns = ["id", "amount"]): SqlResult => ({ columns, rows, truncated: false });
test("SQL curriculum has 12 basic and 12 advanced complete interview problems", () => {
  assert.equal(sqlQuestions.length, 24);
  assert.equal(sqlQuestions.filter(q => q.level === "basic").length, 12);
  assert.equal(sqlQuestions.filter(q => q.level === "advanced").length, 12);
  assert.equal(new Set(sqlQuestions.map(q => q.slug)).size, 24);
  const tables = new Set(createFixture().map(t => t.name));
  for (const [i, q] of sqlQuestions.entries()) {
    assert.equal(q.id, i + 1); assert.ok(q.prompt && q.solution && q.explanation);
    assert.equal(q.hints.length, 2); assert.ok(q.columns.length > 0);
    assert.ok(q.tables.every(t => tables.has(t)));
    assert.doesNotThrow(() => readOnlyQuery(q.solution));
  }
  for (const tag of ["ROW_NUMBER", "RANK", "DENSE_RANK", "LEAD", "LAG"]) assert.ok(sqlQuestions.some(q => q.tags.includes(tag)));
});

test("fixtures are deterministic, consistent, and contain first-order/NULL/tie/refund traps", () => {
  assert.deepEqual(createFixture(), createFixture());
  assert.notEqual(fixtureSql(), fixtureSql(true));
  for (const variation of [false, true]) {
    const tables = createFixture(variation), get = (name: string) => tables.find(t => t.name === name)!.rows;
    const customers = get("customers"), orders = get("orders"), items = get("order_items"), payments = get("payments"), refunds = get("refunds");
    assert.equal(customers.length, 60); assert.equal(orders.length, 251);
    assert.ok(customers.some(c => c[3] === null)); assert.ok(customers.some(c => !orders.some(o => o[1] === c[0])));
    assert.ok(items.some(i => Number(i[3]) > 1));
    for (const order of orders) {
      assert.equal(items.filter(i => i[1] === order[0]).reduce((sum, i) => sum + Number(i[3]) * Number(i[4]), 0), order[4]);
      assert.ok(customers.some(c => c[0] === order[1]));
    }
    for (const payment of payments) assert.ok(refunds.filter(r => r[1] === payment[0] && r[2] === "succeeded").reduce((sum, r) => sum + Number(r[3]), 0) <= Number(payment[3]));
    assert.ok(payments.some(p => refunds.filter(r => r[1] === p[0]).length > 1));
    const eligible: number[] = [];
    for (const customer of customers) {
      const first = orders.filter(o => o[1] === customer[0] && o[3] === "completed").sort((a, b) => String(a[2]).localeCompare(String(b[2])) || Number(a[0]) - Number(b[0]))[0];
      if (first && String(first[2]).startsWith("2026-03") && Number(first[4]) > 10000) eligible.push(Number(customer[0]));
    }
    assert.deepEqual(eligible, variation ? [2, 40, 56, 57, 60] : [2, 40, 56, 57]);
  }
});

test("result checker compares typed duplicate-preserving rows with optional ordering", () => {
  const expected = result([[1, null], [2, 100], [2, 100]]);
  assert.equal(compareResults(result([[2, 100], [1, null], [2, 100]]), expected, false).correct, true);
  assert.equal(compareResults(result([[2, 100], [1, null], [2, 100]]), expected, true).correct, false);
  assert.equal(compareResults(result([[1, null], [2, 100]]), expected, false).correct, false);
  assert.equal(compareResults(result([[1, "NULL"], [2, 100], [2, 100]]), expected, false).correct, false);
  assert.equal(compareResults(result([[null, 1], [100, 2], [100, 2]], ["AMOUNT", "ID"]), expected, false).correct, true);
  assert.equal(compareResults(result([["1", null], [2, 100], [2, 100]]), expected, false).correct, false);
  assert.equal(compareResults(result([[1, null]], ["id", "id"]), expected, false).correct, false);
  assert.equal(compareResults({ ...expected, truncated: true }, expected, false).correct, false);
  assert.equal(compareResults(result([[1, 12.34 + 1e-12]]), result([[1, 12.34]]), false).correct, true);
  assert.equal(compareResults(result([[1, 12.35]]), result([[1, 12.34]]), false).correct, false);
});

test("read-only guard allows comments and quoted semicolons, but rejects writes and statement escapes", () => {
  for (const query of ["SELECT 1; -- end", "/* nested /* SELECT */ comment */ SELECT 'DROP; TABLE' AS value", 'SELECT 1 AS "delete"', "WITH c AS (SELECT 1 AS n) SELECT * FROM c;", "SELECT $$a;b$$ AS text", "SELECT $tag$DROP; TABLE$tag$ AS text", "SELECT 'a'';b' AS text"]) assert.doesNotThrow(() => readOnlyQuery(query));
  for (const query of ["", "DROP TABLE orders", "SELECT 1; SELECT 2", "SELECT 1; COMMIT;", "WITH c AS (SELECT 1) DELETE FROM orders", "SELECT * FROM query('DELETE FROM orders')", "PRAGMA version", "COPY orders TO '/x'", "/* incomplete", "SELECT 'incomplete", "SELECT $$incomplete", "; SELECT 1", "SELECT 1".repeat(3000)]) assert.throws(() => readOnlyQuery(query));
  assert.ok(readOnlyQuery("SELECT 1 -- no newline").endsWith("\n"));
});

test("SQL storage ignores unknown IDs, corrupt shapes, and non-string drafts without touching other journeys", () => {
  const restored = restoreSqlProgress({ drafts: { "completed-orders": "SELECT 1", bogus: "discard", "missing-email": 42 }, notes: { "missing-email": "Use IS NULL", bad: "discard" }, solved: ["completed-orders", "completed-orders", "unknown", 1], lastQuestion: "unknown" });
  assert.deepEqual(restored, { drafts: { "completed-orders": "SELECT 1" }, notes: { "missing-email": "Use IS NULL" }, solved: ["completed-orders"], lastQuestion: "completed-orders" });
  assert.equal(restoreSqlProgress(null).solved.length, 0);
});
