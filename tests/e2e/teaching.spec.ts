import { test, expect } from "@playwright/test";
import { lessons } from "../../src/lib/curriculum";
import { experimentLessons } from "../../src/lib/experimentation";
import { lessonSentences } from "../../src/lib/lesson-copy";
import { forecastCaseStudy } from "../../src/lib/lesson-teaching";

test("all 55 lesson introductions use sentence bullets in both layouts without losing copy", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const [journey, items] of [["forecasting", lessons], ["experimentation", experimentLessons]] as const) {
    for (const lesson of items) {
      await page.goto(`/${journey}/${lesson.slug}`);
      for (const layout of ["Classic", "Lab"]) {
        await page.getByRole("button", { name: layout, exact: true }).click();
        const intro = page.locator(layout === "Lab" ? ".learning-card-lead" : ".lesson-intro").first();
        await expect(intro).toHaveText(lesson.intro);
        const items = lessonSentences(lesson.intro);
        if (items.length > 1) {
          await expect(intro).toHaveRole("list");
          await expect(intro.getByRole("listitem")).toHaveText(items);
        }
      }
    }
  }
  expect(errors).toEqual([]);
});

test("planning copy uses bullets and the full available width above the table", async ({ page }) => {
  await page.setViewportSize({ width: 2400, height: 1200 });
  await page.goto("/forecasting/forecast-is-a-range");
  const study = page.getByRole("region", { name: "Northstar use case", exact: true });
  for (const layout of ["Classic", "Lab"]) {
    await page.getByRole("button", { name: layout, exact: true }).click();
    await expect(study.locator(".lesson-case-intro>li")).toHaveCount(2);
    await expect(study.locator(".lesson-case-intro")).toHaveText(forecastCaseStudy.description);
    for (const [i, row] of forecastCaseStudy.rows.entries()) {
      const cell = study.locator("td").nth(i);
      await expect(cell).toHaveText(row.text);
      await expect(cell.locator("ul>li")).toHaveCount(2);
    }
    const intro = await study.locator(".lesson-case-intro").boundingBox();
    const table = await study.locator("table").boundingBox();
    expect(Math.abs(intro!.width - table!.width)).toBeLessThan(2);
    expect(table!.y - (intro!.y + intro!.height)).toBeLessThanOrEqual(19);
    await expect(study.locator("br")).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Increase text size" }).click();
  for (const layout of ["Classic", "Lab"]) {
    await page.getByRole("button", { name: layout, exact: true }).click();
    await expect(study).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("component definitions and Northstar examples are separate emoji-led table rows", async ({ page }) => {
  await page.goto("/forecasting/trend-seasonality-noise");
  const table = page.locator(".lesson-table").first();
  await expect(table.locator("thead th")).toHaveText(["Component", "What it is", "Northstar example"]);
  await expect(table.locator("tbody th")).toHaveCount(4);
  for (const name of ["Trend", "Seasonality", "Cycle", "Remainder"]) await expect(table.getByRole("rowheader", { name, exact: true })).toBeVisible();
  await expect(table.locator("tbody tr").nth(2)).toContainText("non-fixed period");
  await expect(table.locator("tbody tr").nth(3)).toContainText("not automatically");
  await expect(table.locator("tbody tr").nth(3)).toContainText("Northstar checkout outage");
  await expect(table.locator(".lesson-row-emoji")).toHaveCount(4);
  await expect(page.locator(".lesson-secondary-table")).toContainText("Additive");
  await expect(page.locator(".lesson-secondary-table")).toContainText("Multiplicative");
  await expect(page.locator(".lesson-content-panel .idea-point")).toHaveCount(0);
  await page.goto("/forecasting/trend-or-seasonality");
  await expect(page.locator(".lesson-table tbody tr")).toHaveCount(3);
  await expect(page.locator(".lesson-table")).toContainText("November 27");
  await expect(page.locator(".lesson-table")).toContainText("new country or changes prices");
});

test("first forecast lesson explains Northstar's use case in both layouts", async ({ page }) => {
  await page.goto("/forecasting/forecast-is-a-range");
  const useCase = page.getByRole("region", { name: "Northstar use case", exact: true });
  await expect(page.locator(".lesson-intro")).toContainText("operations team");
  await expect(useCase).toContainText("$32,000");
  await expect(useCase).toContainText("illustrative teaching number");
  await expect(useCase).toContainText("not revenue alone");
  await expect(useCase.getByRole("rowheader")).toHaveCount(6);
  await expect(page.locator(".lesson-table tbody tr")).toHaveCount(3);
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  await expect(useCase).toBeVisible();
  await expect(page.locator(".learning-card").nth(1)).toContainText("$32,000");
  await expect(page.locator(".learning-remember")).toContainText("Remember this");
  await page.getByRole("button", { name: "02 · Explore", exact: true }).click();
  await expect(page.getByRole("slider", { name: "How far ahead" })).toBeVisible();
  await page.getByRole("button", { name: "03 · Check", exact: true }).click();
  await expect(page.locator(".quiz-options button")).toHaveCount(3);
});

test("tables remain readable on mobile and at 140% without changing progress or navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/forecasting/forecast-is-a-range");
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Increase text size" }).click();
  for (const layout of ["Classic", "Lab"]) {
    await page.getByRole("button", { name: layout, exact: true }).click();
    for (const path of ["/forecasting/forecast-is-a-range", "/forecasting/trend-seasonality-noise", "/forecasting/trend-or-seasonality", "/experimentation/why-randomize"]) {
      await page.goto(path);
      if (layout === "Classic") await expect(page.locator(".lesson-table").first()).toBeVisible();
      else await expect(page.locator(".learning-card").first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${layout} ${path}`).toBe(true);
      await expect(page.getByRole("button", { name: "Mark as understood", exact: true })).toHaveAttribute("aria-pressed", "false");
    }
  }
  expect(errors).toEqual([]);
});
