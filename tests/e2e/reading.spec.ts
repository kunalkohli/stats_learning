import { test, expect } from "@playwright/test";
import { lessons } from "../../src/lib/curriculum";

test("all four components share one card and Remember this is highlighted on the same page", async ({ page }) => {
  await page.setViewportSize({ width: 1720, height: 1080 });
  await page.goto("/forecasting/trend-seasonality-noise");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  await expect(page.locator(".learning-card")).toHaveCount(4);
  const first = page.locator(".learning-card").first();
  await expect(first).toContainText("The big idea");
  for (const name of ["Trend", "Seasonality", "Cycle", "Remainder"]) await expect(first.getByRole("rowheader", { name, exact: true })).toBeVisible();
  await expect(page.locator(".learning-card").nth(2)).toContainText("Multiplicative");
  await expect(page.locator(".learning-remember")).toContainText("Remember this");
  await expect(page.locator(".learning-remember .formula")).toHaveText(lessons[1].formula!);
  await expect(page.locator(".deck-next,.deck-page-progress")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mark as understood", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Explore in the lab", exact: false }).click();
  await expect(page.locator(".lab")).toBeVisible();
  await page.getByRole("button", { name: "01 · Learn", exact: true }).click();
  await expect(page.locator(".learning-card")).toHaveCount(4);
});

test("focused cards keep every generic explanation and persist through font and mode changes", async ({ page }) => {
  await page.goto("/forecasting/arima");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  const lesson = lessons.find(l => l.slug === "arima")!;
  await expect(page.locator(".learning-card")).toHaveCount(5);
  for (const point of lesson.points) await expect(page.locator(".learning-cards")).toContainText(point.text);
  await page.getByRole("button", { name: "Increase text size", exact: true }).click();
  await expect(page.locator(".learning-card")).toHaveCount(5);
  await page.getByRole("button", { name: "03 · Check", exact: true }).click();
  await expect(page.locator(".quiz-options button")).toHaveCount(3);
  await page.getByRole("button", { name: "01 · Learn", exact: true }).click();
  await expect(page.locator(".learning-cards")).toContainText(lesson.takeaway);
  await page.goto("/forecasting/baselines");
  await expect(page.locator(".learning-card").first().locator(".baseline-comparison tbody tr")).toHaveCount(5);
  await expect(page.locator(".learning-card").first()).toContainText("Drift");
});

test("same-page cards remain readable at 140% on narrow screens; Classic retains tables", async ({ page }) => {
  await page.goto("/forecasting/trend-seasonality-noise");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Increase text size" }).click();
  for (const width of [320, 390, 800, 1280, 1720]) {
    await page.setViewportSize({ width, height: 1080 });
    for (const path of ["/forecasting/trend-seasonality-noise", "/forecasting/arima", "/experimentation/why-randomize"]) {
      await page.goto(path);
      await expect(page.locator(".learning-remember")).toContainText("Remember this");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} / ${width}px`).toBe(true);
      const boxes = await page.locator(".learning-card").evaluateAll(nodes => nodes.map(n => ({ top: n.getBoundingClientRect().top, bottom: n.getBoundingClientRect().bottom })));
      for (let i = 1; i < boxes.length; i++) expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
    }
  }
  await page.getByRole("button", { name: "Classic", exact: true }).click();
  await expect(page.locator(".learning-cards")).toHaveCount(0);
  await expect(page.locator(".lesson-content-panel .lesson-table tbody tr")).toHaveCount(3);
});
