import { test, expect } from "@playwright/test";

async function ready(page: import("@playwright/test").Page, slug: string) {
  await page.goto(`/forecasting/${slug}`);
  await expect(page.getByRole("button", { name: "Mark as understood", exact: true })).toBeEnabled();
}

test("history selection refits the forecast and reveal is evaluation-only", async ({ page }) => {
  await ready(page, "trend-or-seasonality");
  const initial = await page.locator(".lab-stats strong").first().innerText();
  await page.getByRole("button", { name: "Almost 3 years", exact: true }).click();
  await expect(page.locator(".forecast-method")).toContainText("Fitted trend + calendar months");
  const longer = await page.locator(".lab-stats strong").first().innerText();
  expect(longer).not.toBe(initial);
  await page.getByRole("button", { name: "Reveal what happens", exact: true }).click();
  await expect(page.locator(".lab-stats strong").first()).toHaveText(longer);
  await page.getByRole("button", { name: "Show 3-month reference", exact: true }).click();
  await expect(page.locator(".chart-legend")).toContainText("3-month trend extrapolation");
});

test("rolling backtest animates, pauses, changes origins, and resets", async ({ page }) => {
  await ready(page, "backtesting");
  await page.clock.install();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.clock.runFor(1550);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const origin = await page.getByRole("slider", { name: "Forecast origin", exact: true }).inputValue();
  expect(Number(origin)).toBeGreaterThan(24);
  await page.clock.runFor(1500);
  await expect(page.getByRole("slider", { name: "Forecast origin", exact: true })).toHaveValue(origin);
  await page.getByRole("slider", { name: "Forecast origin", exact: true }).fill("33");
  await expect(page.locator(".lab-stats")).toContainText("30");
  await page.getByRole("button", { name: "Single holdout", exact: true }).click();
  await expect(page.locator('.forecast-method[role="status"]')).toContainText("1 origins · 3 held-out forecasts");
  await page.getByRole("button", { name: "Reset diagram", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Forecast origin", exact: true })).toHaveValue("24");
});

test("reduced-motion users can step through a backtest without autoplay", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page, "backtesting");
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Next origin", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Forecast origin", exact: true })).toHaveValue("25");
});

test("autocorrelation has matching lag pairs, selectable ACF bars, and differencing", async ({ page }) => {
  await ready(page, "autocorrelation");
  await expect(page.getByRole("img", { name: "Current sales versus sales at the selected lag", exact: true }).locator("circle")).toHaveCount(313);
  await page.getByRole("button", { name: "Select lag 14", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Lag in days", exact: true })).toHaveValue("14");
  await page.getByRole("button", { name: "Difference first", exact: true }).click();
  await expect(page.getByRole("img", { name: "Current sales versus sales at the selected lag", exact: true }).locator("circle")).toHaveCount(305);
  await page.getByRole("button", { name: "White noise", exact: true }).click();
  await expect(page.locator(".lab-stats")).toContainText("Expanding-mean MAE");
});

test("white-noise diagnostic exposes a bias that centered ACF does not detect", async ({ page }) => {
  await ready(page, "residuals");
  await page.getByRole("button", { name: "Trend + weekdays", exact: true }).click();
  const q = await page.locator(".lab-stats strong").nth(0).innerText(), bias = Number(await page.locator(".lab-stats strong").nth(2).innerText());
  await page.getByRole("button", { name: "Trend + weekdays · biased +5", exact: true }).click();
  await expect(page.locator(".lab-stats strong").nth(0)).toHaveText(q);
  const shifted = Number(await page.locator(".lab-stats strong").nth(2).innerText());
  expect(shifted - bias).toBeCloseTo(-5, 1);
  await expect(page.locator(".forecast-method")).toContainText("cannot detect that constant bias");
});

test("growth-rate choices and six error metrics react to genuine computed changes", async ({ page }) => {
  await ready(page, "growth-rates");
  const all = await page.locator(".lab-stats strong").first().innerText();
  await page.getByRole("button", { name: "Latest month", exact: true }).click();
  await expect(page.locator(".lab-stats strong").first()).toHaveText("17.8%");
  expect(all).not.toBe("17.8%");
  await page.getByRole("button", { name: "Reveal November", exact: true }).click();
  await expect(page.locator(".lab-stats")).toContainText("119.2");
  await ready(page, "error-metrics");
  await page.getByRole("slider", { name: "Random noise (%)", exact: true }).fill("0");
  await page.getByRole("slider", { name: "Systematic under-forecast (%)", exact: true }).fill("10");
  const bias = await page.locator(".lab-stats strong").last().innerText();
  await page.getByRole("slider", { name: "Random noise (%)", exact: true }).fill("15");
  await expect(page.locator(".lab-stats strong").last()).toHaveText(bias);
  await page.getByRole("button", { name: "Closed for a month", exact: true }).click();
  await expect(page.locator(".lab-stats")).toContainText("Undefined: zero actual");
});

test("hierarchy, driver uncertainty, and interval coverage demonstrate their failure cases", async ({ page }) => {
  await ready(page, "hierarchical-forecasts");
  await expect(page.locator(".hierarchy-gap")).toContainText("$6,000");
  for (const method of ["Bottom-up", "Top-down", "Reconciled"]) {
    await page.getByRole("button", { name: method, exact: true }).click();
    await expect(page.locator(".lab-stats strong").first()).toHaveText("Yes");
  }
  await ready(page, "drivers-leakage");
  await page.getByRole("slider", { name: "Visitor forecast error (thousands)", exact: true }).fill("0");
  expect(await page.locator(".lab-stats strong").nth(0).innerText()).toBe(await page.locator(".lab-stats strong").nth(1).innerText());
  await page.getByRole("slider", { name: "Visitor forecast error (thousands)", exact: true }).fill("6");
  await page.getByRole("button", { name: "Use actual future visitors (leakage)", exact: true }).click();
  await expect(page.locator(".lab-leak-warning")).toBeVisible();
  await ready(page, "prediction-intervals");
  const outside = await page.locator('.coverage-dot[data-inside="false"]').count();
  await page.getByRole("slider", { name: "Assumed uncertainty (%)", exact: true }).fill("50");
  expect(await page.locator('.coverage-dot[data-inside="false"]').count()).toBeGreaterThan(outside);
});

test("new labs fit mobile with 140% text and leave key controls reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page, "backtesting");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Increase text size" }).click();
  for (const slug of ["trend-or-seasonality", "baselines", "growth-rates", "backtesting", "error-metrics", "autocorrelation", "residuals", "hierarchical-forecasts", "drivers-leakage", "prediction-intervals"]) {
    await page.goto(`/forecasting/${slug}`);
    await page.getByRole("button", { name: "02 · Explore", exact: true }).click();
    await expect(page.locator(".lab")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), slug).toBe(true);
  }
});
