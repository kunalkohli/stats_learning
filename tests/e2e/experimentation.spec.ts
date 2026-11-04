import { test, expect } from "@playwright/test";
import { experimentLessons } from "../../src/lib/experimentation";
import { lessons } from "../../src/lib/curriculum";
import { plannedPerArm } from "../../src/lib/experiment-math";

test("experimentation is live and all classic lessons render with correct labs", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await page.locator(".experiment-card").click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Experimentation");
  await expect(page.locator(".journey-part-card")).toHaveCount(6);
  for (const lesson of experimentLessons) {
    await page.goto(`/experimentation/${lesson.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(lesson.heading);
    await expect(page.locator(".experiment-lab")).toBeVisible();
    await expect(page.locator(".lesson-table")).toBeVisible();
    await expect(page.locator(".quiz-options button")).toHaveCount(3);
    await page.locator(".quiz-options button").nth(lesson.correct).click();
    await expect(page.locator(".quiz-answer")).toContainText("That’s the idea");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("layout choice persists across journeys and the card deck, modes, and reset work", async ({ page }) => {
  await page.goto("/experimentation/why-randomize");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-layout", "lab");
  await expect(page.locator(".learning-cards")).toContainText("The big idea");
  await expect(page.locator(".learning-cards")).toContainText("The counterfactual is missing");
  await expect(page.locator(".learning-cards")).toContainText("Random assignment makes a fair starting point");
  await page.getByRole("button", { name: "02 · Explore" }).click();
  await page.getByRole("button", { name: "Random assignment", exact: true }).click();
  await expect(page.getByRole("button", { name: "Random assignment", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Reset diagram" }).click();
  await expect(page.getByRole("button", { name: "Random assignment", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Check yourself", exact: false }).click();
  await page.getByLabel("Your note for Why randomize?").fill("Random assignment before comparing conversion.");
  await page.getByRole("button", { name: "Classic", exact: true }).click();
  await expect(page.getByLabel("Your note for Why randomize?")).toHaveValue("Random assignment before comparing conversion.");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  await page.getByRole("link", { name: "Forecasting", exact: true }).first().click();
  await expect(page.locator(".journey-part-card")).toHaveCount(6);
  await page.goto("/forecasting/arima");
  await expect(page.locator(".learning-cards")).toBeVisible();
  await page.getByRole("button", { name: "02 · Explore" }).click();
  await expect(page.getByRole("slider", { name: "AR coefficient φ" })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-layout", "lab");
  await page.getByRole("button", { name: "Classic", exact: true }).click();
  await expect(page.locator(".lesson-content-panel")).toBeVisible();
});

test("all labs render in Lab mode and both journeys fit mobile", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  for (const lesson of experimentLessons) {
    await page.goto(`/experimentation/${lesson.slug}`);
    await page.getByRole("button", { name: "02 · Explore" }).click();
    await expect(page.locator(".lab")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const layout of ["Lab", "Classic"]) {
    await page.getByRole("button", { name: layout, exact: true }).click();
    for (const path of ["/", "/forecasting", "/experimentation", "/journal", ...experimentLessons.map(l => `/experimentation/${l.slug}`), ...(layout === "Lab" ? lessons.map(l => `/forecasting/${l.slug}`) : [])]) {
      await page.goto(path);
      if (layout === "Lab" && path.split("/").length === 3) await page.getByRole("button", { name: "02 · Explore" }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${layout} ${path}`).toBe(true);
    }
  }
  await page.goto("/experimentation/power-and-mde");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await expect(page.locator(".learning-sidebar")).toHaveClass(/open/);
  await page.locator(".learning-sidebar").getByRole("button", { name: "Close contents" }).click();
  await expect(page.locator(".learning-sidebar")).not.toHaveClass(/open/);
  expect(errors).toEqual([]);
});

test("experiment notes and progress survive layouts and stay separate from forecasting", async ({ page }) => {
  await page.goto("/forecasting/forecast-is-a-range");
  await page.getByLabel("Your note for A forecast is a range").fill("Keep my original forecasting note.");
  await page.getByRole("button", { name: "Mark as understood", exact: true }).click();
  await page.goto("/experimentation/why-randomize");
  await page.getByLabel("Your note for Why randomize?").fill("Buyer-level randomization, not request-level pseudo-replication.");
  await page.getByRole("button", { name: "Mark as understood", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Your note for Why randomize?")).toHaveValue("Buyer-level randomization, not request-level pseudo-replication.");
  await expect(page.getByRole("button", { name: "Marked as understood" })).toBeVisible();
  await page.goto("/journal");
  await expect(page.locator(".journal-entries").first()).toContainText("Keep my original forecasting note.");
  await expect(page.locator(".experiment-journal")).toContainText("Buyer-level randomization");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export experimentation notes" }).click();
  expect((await download).suggestedFilename()).toBe("statsconcepts-experimentation-journal.md");
  await page.goto("/experimentation/hypothesis-and-metrics");
  await expect(page.getByLabel("Your note for Hypothesis & success")).toHaveValue("");
  await page.goto("/forecasting/forecast-is-a-range");
  await expect(page.getByLabel("Your note for A forecast is a range")).toHaveValue("Keep my original forecasting note.");
});

test("experiment controls update computed metrics and workflow keeps one open step", async ({ page }) => {
  await page.goto("/experimentation/conversion-and-lift");
  await expect(page.getByRole("button", { name: "Mark as understood", exact: true })).toBeEnabled();
  await expect(page.locator(".lab-stats")).toContainText("2.00%");
  await page.getByRole("slider", { name: "Observed lift (basis points)" }).fill("40");
  await expect(page.locator(".lab-stats")).toContainText("4.00%");
  await page.goto("/experimentation/power-and-mde");
  await expect(page.locator(".lab-stats")).toContainText(plannedPerArm(0.1, 0.002).toLocaleString("en-US"));
  await page.getByRole("slider", { name: "Relative MDE", exact: true }).fill("4");
  await expect(page.locator(".lab-stats")).toContainText(plannedPerArm(0.1, 0.004).toLocaleString("en-US"));
  await page.goto("/experimentation/experimentation-workflow");
  await expect(page.locator(".experiment-workflow button")).toHaveCount(8);
  await page.locator("#experiment-step-2").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".experiment-workflow .workflow-step-detail:visible")).toHaveCount(1);
  await expect(page.locator("#experiment-detail-2")).toContainText("seven-day conversion");
  await page.keyboard.press("Space");
  await expect(page.locator(".experiment-workflow .workflow-step-detail:visible")).toHaveCount(1);
});

test("unknown experiment routes 404 and blocked preference storage remains usable", async ({ page }) => {
  const response = await page.goto("/experimentation/not-a-real-stop");
  expect(response?.status()).toBe(404);
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error("Blocked"); }; Storage.prototype.setItem = () => { throw new Error("Blocked"); }; });
  await page.goto("/experimentation/why-randomize");
  await expect(page.getByRole("status")).toContainText("storage is unavailable");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  await expect(page.locator(".learning-cards")).toBeVisible();
});
