import { test, expect } from "@playwright/test";
import { lessons } from "../../src/lib/curriculum";

test("home, journey map, and all 31 lessons render without client errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Data science");
  await expect(page.getByRole("link", { name: "DSConcepts home" }).first()).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(238, 238, 229)");
  expect(await page.locator(".concept-sketch").evaluate(el => el.getBoundingClientRect().width)).toBeLessThanOrEqual(290);
  await page.getByRole("link", { name: "Start with forecasting" }).click();
  await expect(page.locator(".map-svg-link")).toHaveCount(lessons.length);
  for (const lesson of lessons) {
    await page.goto(`/forecasting/${lesson.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(lesson.heading);
    await expect(page.locator(".lab")).toBeVisible();
    await expect(page.locator(".lesson-table").first()).toBeVisible();
    await expect(page.locator(".quiz-options button")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Mark as understood", exact: true })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("LLMs & AI is clearly a non-interactive work-in-progress journey", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "LLMs & AI", exact: true }) });
  for (const layout of ["Classic", "Lab"]) {
    await page.getByRole("button", { name: layout, exact: true }).click();
    await expect(card).toBeVisible();
    await expect(card).toContainText("WORK IN PROGRESS");
    await expect(card).toContainText("transformers");
    await expect(card).toContainText("How to use AI models");
    await expect(card).toContainText("not available yet");
    await expect(card.locator("a, button")).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Increase text size" }).click();
  for (const layout of ["Classic", "Lab"]) {
    await page.getByRole("button", { name: layout, exact: true }).click();
    await expect(card).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("range controls, quiz feedback, and diagram reset work", async ({ page }) => {
  await page.goto("/forecasting/forecast-is-a-range");
  await expect(page.getByRole("button", { name: "Mark as understood", exact: true })).toBeEnabled();
  await expect(page.getByRole("slider", { name: "How far ahead" })).toHaveValue("28");
  await page.getByRole("slider", { name: "How far ahead" }).fill("60");
  await expect(page.getByRole("slider", { name: "How far ahead" })).toHaveValue("60");
  await page.getByRole("button", { name: "Show uncertainty" }).click();
  await expect(page.getByText("Hidden, not gone")).toBeVisible();
  await page.getByRole("button", { name: "Reset diagram" }).click();
  await expect(page.getByRole("slider", { name: "How far ahead" })).toHaveValue("28");
  await page.locator(".quiz-options button").nth(0).click();
  await expect(page.getByRole("status")).toContainText("Not quite");
  await page.locator(".quiz-options button").nth(1).click();
  await expect(page.getByRole("status")).toContainText("That’s the idea");
});

test("AR playground shows the correct mean reversion and alternating memory", async ({ page }) => {
  await page.goto("/forecasting/arima");
  await expect(page.getByRole("button", { name: "Mark as understood", exact: true })).toBeEnabled();
  await expect(page.locator(".equation-live")).toContainText("$33.5K");
  await page.getByRole("slider", { name: "AR coefficient φ" }).fill("-0.7");
  await expect(page.locator(".equation-live")).toContainText("$26.5K");
  await expect(page.getByText("Negative → alternating")).toBeVisible();
  await page.getByRole("button", { name: "Simulated sample", exact: true }).click();
  await expect(page.getByText("SAMPLE ACF · 500 SIMULATED OBSERVATIONS")).toBeVisible();
});

test("notes and completion persist, journal exports, and progress can be toggled", async ({ page }) => {
  await page.goto("/forecasting/arima");
  await page.getByLabel("Your note for ARIMA & autoregression").fill("ACF describes memory; AR uses it. φ shrinks deviations from the mean.");
  await page.getByRole("button", { name: "Mark as understood", exact: true }).click();
  await expect(page.getByRole("button", { name: "Marked as understood" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Your note for ARIMA & autoregression")).toContainText("ACF describes memory");
  await expect(page.getByRole("button", { name: "Marked as understood" })).toBeVisible();
  await page.getByRole("link", { name: "Learning journal", exact: true }).first().click();
  await expect(page.locator(".journal-entries")).toContainText("ACF describes memory");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export as Markdown" }).click();
  expect((await download).suggestedFilename()).toBe("statsconcepts-forecasting-journal.md");
  await page.goto("/forecasting/arima");
  await page.getByRole("button", { name: "Marked as understood" }).click();
  await expect(page.getByRole("button", { name: "Mark as understood", exact: true })).toBeVisible();
});

test("mobile layouts fit and contents opens and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/forecasting", ...lessons.map(l => `/forecasting/${l.slug}`), "/journal"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.goto("/forecasting/arima");
  await page.getByRole("button", { name: "Contents", exact: false }).first().click();
  await expect(page.locator(".learning-sidebar")).toHaveClass(/open/);
  await page.locator(".learning-sidebar").getByRole("button", { name: "Close contents" }).click();
  await expect(page.locator(".learning-sidebar")).not.toHaveClass(/open/);
});

test("corrupt storage and unknown routes fail gracefully", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("statsconcepts-progress-v2", "not-json"));
  await page.goto("/forecasting/autocorrelation");
  await expect(page.getByRole("status")).toContainText("storage is unavailable");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Does the past leave an echo?");
  const response = await page.goto("/forecasting/not-a-real-stop");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("isn’t on the map");
});

test("rename preserves existing progress and notes", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("fieldnotes-progress-v1", JSON.stringify({ understood: [20], notes: { 20: "My existing ARIMA note" }, lastLesson: 20 })));
  await page.goto("/forecasting/arima");
  await expect(page.getByRole("button", { name: "Marked as understood" })).toBeVisible();
  await expect(page.getByLabel("Your note for ARIMA & autoregression")).toHaveValue("My existing ARIMA note");
});

test("the final stop has a working roadmap, model guide, navigation, and saved progress", async ({ page }) => {
  await page.goto("/forecasting/forecast-plan-target");
  await page.locator(".lesson-next a").click();
  await expect(page).toHaveURL(/forecasting-workflow$/);
  await expect(page.locator(".learning-breadcrumb")).toContainText("STOP 31 / 31");
  await expect(page.locator(".workflow-flow button")).toHaveCount(8);
  await expect(page.locator("#workflow-detail-1")).toBeVisible();
  await expect(page.locator("#workflow-detail-2")).toBeHidden();
  await page.locator("#workflow-step-2").click();
  await expect(page.locator("#workflow-detail-2")).toBeVisible();
  await expect(page.locator("#workflow-detail-1")).toBeHidden();
  await expect(page.locator(".workflow-step-detail:visible")).toHaveCount(1);
  await page.locator(".workflow-flow button").nth(5).click();
  await expect(page.locator("#workflow-detail-6")).toBeVisible();
  expect(await page.locator("#workflow-detail-6").evaluate(el => Math.abs(el.getBoundingClientRect().top - el.previousElementSibling!.getBoundingClientRect().bottom))).toBeLessThan(5);
  await expect(page.locator(".workflow-recommendation")).toContainText("Fourier");
  await page.getByLabel("What does your series or its errors look like?").selectOption("level");
  await expect(page.locator(".workflow-recommendation")).toContainText("Simple exponential smoothing (SES)");
  await page.getByLabel("What does your series or its errors look like?").selectOption("memory");
  await expect(page.locator(".workflow-recommendation")).toContainText("regression with ARIMA errors");
  await page.getByRole("button", { name: "Reset diagram" }).click();
  await expect(page.locator("#workflow-detail-1")).toBeVisible();
  await expect(page.locator("#workflow-detail-6")).toBeHidden();
  await expect(page.getByLabel("What does your series or its errors look like?")).toHaveValue("northstar");
  await page.getByRole("button", { name: "Mark as understood", exact: true }).click();
  await page.getByLabel("Your note for A forecasting workflow").fill("Baseline → backtest → diagnose → targeted improvement.");
  await page.reload();
  await expect(page.getByRole("button", { name: "Marked as understood" })).toBeVisible();
  await expect(page.getByLabel("Your note for A forecasting workflow")).toHaveValue("Baseline → backtest → diagnose → targeted improvement.");
  await expect(page.locator(".sidebar-progress")).toContainText("1 / 31 understood");
  await page.locator(".lesson-next a").click();
  await expect(page).toHaveURL(/journal$/);
  await expect(page.locator(".journal-entries")).toContainText("A forecasting workflow");
});

test("MSTL pipeline diagram and three-model comparison render and respond", async ({ page }) => {
  await page.goto("/forecasting/mstl-ets");
  await expect(page.locator(".lab")).toContainText("Remove, forecast, project, recombine");
  await page.getByRole("button", { name: "4. Add them back", exact: true }).click();
  await expect(page.locator(".seasonal-stage-explanation")).toContainText("Add the adjusted-series forecast");
  await expect(page.getByRole("img", { name: "Schematic MSTL and ETS pipeline" })).toBeVisible();
  await page.getByRole("button", { name: "Weekly component", exact: true }).click();
  await expect(page.getByRole("button", { name: "Weekly component", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Reset diagram" }).click();
  await expect(page.getByRole("button", { name: "1. Remove seasons", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.locator(".lesson-next a").click();
  await expect(page).toHaveURL(/prophet-dhr-mstl$/);
  await expect(page.locator(".comparison-table")).toBeVisible();
  await expect(page.locator(".comparison-table thead th")).toHaveText(["Compare", "Prophet", "DHR", "MSTL + ETS"]);
  await expect(page.locator(".comparison-table tbody tr")).toHaveCount(9);
  await expect(page.getByRole("rowheader", { name: "Strengths", exact: true })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "Weaknesses", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Calendar & drivers", exact: true }).click();
  await expect(page.locator(".comparison-table tbody tr")).toHaveCount(2);
  await page.getByLabel("What matters most in your use case?").selectOption("memory");
  await expect(page.locator(".comparison-scenario p")).toContainText("ARIMA error process");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Full table", exact: true }).click();
  await expect(page.locator(".comparison-table tbody tr")).toHaveCount(9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("adding model lessons keeps earlier workflow notes on the correct topic", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("statsconcepts-progress-v1", JSON.stringify({ understood: [24, 29], notes: { 24: "Interval coverage", 29: "My original workflow note" }, lastLesson: 29 })));
  await page.goto("/forecasting/forecasting-workflow");
  await expect(page.getByRole("button", { name: "Marked as understood" })).toBeVisible();
  await expect(page.getByLabel("Your note for A forecasting workflow")).toHaveValue("My original workflow note");
  await page.reload();
  await expect(page.getByLabel("Your note for A forecasting workflow")).toHaveValue("My original workflow note");
  await page.goto("/forecasting/prediction-intervals");
  await expect(page.getByLabel("Your note for Prediction intervals")).toHaveValue("Interval coverage");
  await page.goto("/forecasting/mstl-ets");
  await expect(page.getByRole("button", { name: "Mark as understood", exact: true })).toBeEnabled();
  await expect(page.getByLabel("Your note for MSTL + ETS")).toHaveValue("");
});

test("workflow expands in place with exactly one open step on mobile and keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/forecasting/forecasting-workflow");
  await page.locator("#workflow-step-3").click();
  await expect(page.locator("#workflow-step-3")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#workflow-detail-3")).toBeVisible();
  expect(await page.locator("#workflow-detail-3").evaluate(el => Math.abs(el.getBoundingClientRect().top - el.previousElementSibling!.getBoundingClientRect().bottom))).toBeLessThan(5);
  await expect(page.locator("#workflow-detail-1")).toBeHidden();
  await expect(page.locator(".workflow-step-detail:visible")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator("#workflow-step-4").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#workflow-detail-4")).toBeVisible();
  await expect(page.locator("#workflow-detail-3")).toBeHidden();
  await page.keyboard.press("Space");
  await expect(page.locator("#workflow-detail-4")).toBeVisible();
  await page.locator("#workflow-step-2").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#workflow-detail-2")).toBeVisible();
  await expect(page.locator("#workflow-detail-4")).toBeHidden();
  await expect(page.locator(".workflow-step-detail:visible")).toHaveCount(1);
});
