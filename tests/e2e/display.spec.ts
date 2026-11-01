import { test, expect } from "@playwright/test";

test("text defaults to 90%, scales real text without zoom, and persists across layouts and routes", async ({ page }) => {
  await page.goto("/experimentation/underpowered-tests");
  const controls = page.getByRole("group", { name: "Text size", exact: true });
  await expect(controls).toContainText("90%");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-family", /Nunito Lab/);
  const before = await page.getByRole("heading", { level: 1 }).evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  await page.getByRole("button", { name: "Increase text size" }).click();
  await expect(controls).toContainText("100%");
  const after = await page.getByRole("heading", { level: 1 }).evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(after / before).toBeCloseTo(100 / 90, 3);
  expect(await page.locator("html").evaluate(el => getComputedStyle(el).zoom)).toBe("1");
  await page.getByRole("button", { name: "02 · Explore" }).click();
  await expect(page.locator(".guided-steps li")).toHaveCount(2);
  await expect(page.locator(".focus-titlebar .focus-tabs")).toBeVisible();
  await page.getByRole("slider", { name: "Buyers per arm", exact: true }).fill("50000");
  await page.getByRole("button", { name: "Increase text size" }).click();
  await expect(page.getByRole("slider", { name: "Buyers per arm", exact: true })).toHaveValue("50000");
  await page.reload();
  await expect(controls).toContainText("110%");
  for (const route of ["/", "/forecasting/arima", "/journal"]) {
    await page.goto(route);
    await expect(controls).toContainText("110%");
  }
  await page.getByRole("button", { name: "Classic", exact: true }).click();
  await expect(controls).toContainText("110%");
  await page.getByRole("button", { name: "Reset text size to 90%" }).click();
  await expect(controls).toContainText("90%");
});

test("size limits, corrupted preferences, and blocked storage remain usable", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("statsconcepts-text-size", "corrupt"));
  await page.reload();
  await expect(page.locator(".text-size-value")).toHaveText("90%");
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Increase text size" }).click();
  await expect(page.locator(".text-size-value")).toHaveText("140%");
  await expect(page.getByRole("button", { name: "Increase text size" })).toBeDisabled();
  for (let i = 0; i < 7; i++) await page.getByRole("button", { name: "Decrease text size" }).click();
  await expect(page.locator(".text-size-value")).toHaveText("70%");
  await expect(page.getByRole("button", { name: "Decrease text size" })).toBeDisabled();
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error("Blocked"); }; Storage.prototype.setItem = () => { throw new Error("Blocked"); }; });
  await page.goto("/experimentation/why-randomize");
  await expect(page.locator(".text-size-value")).toHaveText("90%");
  await page.getByRole("button", { name: "Increase text size" }).click();
  await expect(page.locator(".text-size-value")).toHaveText("100%");
});

test("font loads locally, the reference scatterplot is interactive, and large text fits mobile", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/experimentation/underpowered-tests");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  await page.getByRole("button", { name: "02 · Explore" }).click();
  await expect(page.getByRole("img", { name: "300 simulated treatment estimates, significance region, and true effect" })).toBeVisible();
  await expect(page.locator(".simulation-chart circle")).toHaveCount(300);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('900 16px "Nunito Lab"'))).toBe(true);
  await page.getByRole("slider", { name: "Buyers per arm", exact: true }).fill("50000");
  await expect(page.locator(".lab-stats")).toContainText("100.0%");
  await page.getByRole("button", { name: "Run 300 new trials" }).click();
  await expect(page.locator(".simulation-chart circle")).toHaveCount(300);
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Increase text size" }).click();
  for (const layout of ["Lab", "Classic"]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: layout, exact: true }).click();
    for (const route of ["/", "/forecasting/arima", "/experimentation/underpowered-tests", "/journal"]) {
      await page.goto(route);
      if (layout === "Lab" && route.split("/").length === 3) await page.getByRole("button", { name: "02 · Explore" }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${layout} ${route} at 140%`).toBe(true);
    }
    for (const width of [320, 390, 800, 1024, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/experimentation/underpowered-tests");
      const headerFits = await page.locator(".learning-header").evaluate(el => el.scrollWidth <= el.clientWidth);
      expect(headerFits, `${layout} toolbar at ${width}px / 140%`).toBe(true);
      const plus = await page.getByRole("button", { name: "Increase text size" }).boundingBox();
      expect(plus!.x + plus!.width).toBeLessThanOrEqual(width);
    }
  }
  expect(errors).toEqual([]);
});
