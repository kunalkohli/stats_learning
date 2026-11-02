import { test, expect, type Page } from "@playwright/test";
import { sqlQuestions } from "../../src/lib/sql/questions";

async function write(page: Page, source: string) {
  await expect(page.locator(".cm-content")).toBeVisible();
  await page.getByRole("textbox", { name: "SQL query editor", exact: true }).fill(source);
}
async function check(page: Page, source: string) {
  await write(page, source);
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator(".sql-feedback.correct")).toBeVisible({ timeout: 40000 });
}

test("all 24 reference solutions execute in real DuckDB and pass both fixtures", async ({ page }) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "DSConcepts home" }).first()).toBeVisible();
  await page.locator(".sql-journey-card").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Practice SQL questions.");
  await expect(page.locator(".sql-problem-card")).toHaveCount(24);
  for (const q of sqlQuestions) {
    await page.goto(`/sql-practice/${q.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(q.title);
    await expect(page.locator(".cm-content")).toHaveText("");
    await check(page, q.solution);
    await expect(page.locator(".sql-feedback.correct")).toContainText("visible dataset and an amount-variation fixture");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await expect(page.locator(".sidebar-progress")).toContainText("24 / 24 solved");
  expect(errors).toEqual([]);
});

test("new problems start blank, saved drafts survive, and clearing requires consent without erasing notes", async ({ page }) => {
  await page.goto("/sql-practice/march-first-order-over-100");
  await expect(page.locator(".cm-content")).toHaveText("");
  await expect(page.locator(".sql-solution pre")).toBeHidden();
  await write(page, "SELECT * FROM orders");
  const notes = page.getByLabel("Scratchpad for First-ever order in March, over $100");
  await notes.fill("Rank all history before filtering March.");
  await page.reload();
  await expect(page.locator(".cm-content")).toHaveText("SELECT * FROM orders");
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Clear query", exact: true }).click();
  await expect(page.locator(".cm-content")).toHaveText("SELECT * FROM orders");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Clear query", exact: true }).click();
  await expect(page.locator(".cm-content")).toHaveText("");
  await expect(notes).toHaveValue("Rank all history before filtering March.");
  await page.reload();
  await expect(page.locator(".cm-content")).toHaveText("");
  await page.locator(".sql-solution summary").click();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Load solution into editor", exact: true }).click();
  await expect(page.locator(".cm-content")).toContainText("ROW_NUMBER()");
});

test("different correct SQL passes; wrong answers, NULL mistakes, aliases, and ordering fail usefully", async ({ page }) => {
  await page.goto("/sql-practice/completed-orders");
  await write(page, "SELECT 1 AS order_id, 123 AS order_total_cents");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator(".sql-feedback.incorrect")).toContainText("missing", { timeout: 40000 });
  await check(page, "SELECT order_total_cents, order_id FROM orders WHERE 10000 < order_total_cents AND 'completed' = status ORDER BY order_id ASC");
  await write(page, "SELECT order_id, order_total_cents FROM orders WHERE status = 'completed' AND order_total_cents > 10000 ORDER BY order_id DESC");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator(".sql-feedback.incorrect")).toContainText("order does not");
  await write(page, "SELECT 1 AS wrong_name");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator(".sql-feedback.incorrect")).toContainText("Expected columns");
});

test("expected output and hints are available without awarding solved progress; scratchpad and drafts persist", async ({ page }) => {
  await page.goto("/sql-practice/missing-email");
  await page.getByRole("button", { name: "Expected output", exact: true }).click();
  await expect(page.getByRole("table", { name: "Expected results", exact: true })).toBeVisible({ timeout: 40000 });
  await expect(page.locator(".sidebar-progress")).toContainText("0 / 24 solved");
  await page.getByRole("button", { name: "Your results", exact: true }).click();
  await expect(page.locator(".sql-results-placeholder")).toBeVisible();
  await page.getByRole("button", { name: "Show a hint", exact: false }).click();
  await expect(page.locator(".sql-help")).toContainText("NULL is not an empty string");
  await write(page, "SELECT customer_id, customer_name FROM customers WHERE email IS NULL");
  await page.getByLabel("Scratchpad for Missing customer emails").fill("IS NULL, not = NULL. Preserve the customer grain.");
  await page.getByRole("textbox", { name: "SQL query editor", exact: true }).press("Control+Enter");
  await expect(page.getByRole("table", { name: "Query results", exact: true })).toBeVisible({ timeout: 40000 });
  await expect(page.locator(".sidebar-progress")).toContainText("0 / 24 solved");
  await page.reload();
  await expect(page.locator(".cm-content")).toContainText("WHERE email IS NULL");
  await expect(page.getByLabel("Scratchpad for Missing customer emails")).toHaveValue("IS NULL, not = NULL. Preserve the customer grain.");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  await expect(page.locator(".cm-content")).toContainText("WHERE email IS NULL");
  await page.getByRole("button", { name: "Increase text size" }).click();
  await expect(page.locator(".cm-content")).toContainText("WHERE email IS NULL");
});

test("first-ever March cohort rejects filtering the month or amount too early", async ({ page }) => {
  await page.goto("/sql-practice/march-first-order-over-100");
  await write(page, "WITH ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at, order_id) AS rn FROM orders WHERE status = 'completed' AND ordered_at >= TIMESTAMP '2026-03-01' AND ordered_at < TIMESTAMP '2026-04-01' AND order_total_cents > 10000) SELECT customer_id, order_id AS first_order_id, order_total_cents AS first_order_cents FROM ranked WHERE rn = 1");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator(".sql-feedback.incorrect")).toBeVisible({ timeout: 40000 });
  await check(page, sqlQuestions[13].solution);
  await expect(page.getByRole("table", { name: "Query results", exact: true }).locator("tbody tr")).toHaveCount(4);
  // A memorized visible answer is not a general query and must fail the amount variation.
  await write(page, "SELECT * FROM (VALUES (2, 113, 19000), (40, 87, 16000), (56, 311, 20000), (57, 301, 15000)) AS t(customer_id, first_order_id, first_order_cents)");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator(".sql-feedback.incorrect")).toContainText("amount-variation fixture");
});

test("sandbox blocks writes, multiple statements, network access, and recovers after SQL errors", async ({ page, baseURL }) => {
  const external: string[] = [];
  page.on("request", request => { if (new URL(request.url()).origin !== new URL(baseURL!).origin) external.push(request.url()); });
  await page.goto("/sql-practice/completed-orders");
  for (const source of ["DROP TABLE orders", "SELECT 1; DELETE FROM orders", "SELECT * FROM does_not_exist", "SELECT * FROM read_csv('https://example.invalid/private.csv')"]) {
    await write(page, source);
    await page.getByRole("button", { name: "Run query", exact: true }).click();
    await expect(page.locator(".sql-error")).toBeVisible({ timeout: 40000 });
  }
  await check(page, sqlQuestions[0].solution);
  expect(external).toEqual([]);
});

test("run caps output and timeouts/cancel stop the worker without losing the draft", async ({ page }) => {
  test.setTimeout(90000);
  await page.goto("/sql-practice/completed-orders");
  await write(page, "SELECT range AS n FROM range(1000)");
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(page.locator(".sql-limit-warning")).toBeVisible({ timeout: 40000 });
  const infinite = "WITH RECURSIVE t(n) AS (SELECT 1::BIGINT UNION ALL SELECT n + 1 FROM t) SELECT SUM(n) AS total FROM t";
  await write(page, infinite);
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await expect(page.locator(".sql-error")).toContainText("exceeded 5 seconds", { timeout: 15000 });
  await expect(page.locator(".cm-content")).toContainText("WITH RECURSIVE");
  await check(page, sqlQuestions[0].solution);
  await write(page, infinite);
  await page.getByRole("button", { name: "Run query", exact: true }).click();
  await page.getByRole("button", { name: "Cancel query", exact: true }).click();
  await expect(page.locator(".sql-error")).toContainText("Query cancelled");
  await check(page, sqlQuestions[0].solution);
});

test("SQL routes fit both layouts at large text; schemas, mobile contents, exports, and 404s work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sql-practice");
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Increase text size" }).click();
  for (const layout of ["Lab", "Classic"]) {
    await page.getByRole("button", { name: layout, exact: true }).click();
    for (const path of ["/sql-practice", "/sql-practice/completed-orders", "/sql-practice/march-first-order-over-100", "/sql-practice/calendar-running-spend"]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${layout} ${path}`).toBe(true);
    }
  }
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await expect(page.locator(".learning-sidebar")).toHaveClass(/open/);
  await page.locator(".learning-sidebar").getByRole("button", { name: "Close contents" }).click();
  await page.getByLabel("Inspect a table").selectOption("payments");
  await expect(page.locator(".sql-columns")).toContainText("payment_id");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download complete fixture SQL" }).click();
  expect((await download).suggestedFilename()).toBe("dsconcepts-northstar-fixture.sql");
  const response = await page.goto("/sql-practice/not-a-problem");
  expect(response?.status()).toBe(404);
});

test("rebrand preserves legacy progress and SQL storage failure does not block practice", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("statsconcepts-progress-v2", JSON.stringify({ understood: [1], notes: { 1: "Original forecasting note" }, lastLesson: 1 }));
    localStorage.setItem("dsconcepts-sql-progress-v1", "invalid-json");
  });
  await page.goto("/sql-practice/completed-orders");
  await expect(page.locator(".storage-warning")).toContainText("storage is unavailable");
  await check(page, sqlQuestions[0].solution);
  await page.goto("/forecasting/forecast-is-a-range");
  await expect(page.getByLabel("Your note for A forecast is a range")).toHaveValue("Original forecasting note");
  await expect(page.getByRole("button", { name: "Marked as understood" })).toBeVisible();
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error("Blocked"); }; Storage.prototype.setItem = () => { throw new Error("Blocked"); }; });
  await page.goto("/sql-practice/completed-orders");
  await expect(page.locator(".storage-warning")).toContainText("storage is unavailable");
  await check(page, sqlQuestions[0].solution);
});
