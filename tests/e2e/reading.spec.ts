import { test, expect } from "@playwright/test";
import { lessons } from "../../src/lib/curriculum";

test("grouped Learn uses desktop width and combines six ideas into two complete panels", async ({ page }) => {
  await page.setViewportSize({ width: 1720, height: 1080 });
  await page.goto("/forecasting/trend-seasonality-noise");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  const deck = page.getByRole("region", { name: "Concept cards", exact: true });
  await expect(deck.locator(".reading-block")).toHaveCount(3);
  await expect(deck).toContainText("The setup");
  await expect(deck).toContainText("Trend is the underlying direction.");
  await expect(deck).toContainText("Seasonality is calendar-linked repetition.");
  await expect(deck.locator(".deck-page-progress")).toHaveText("Page 1 of 2");
  const geometry = await page.evaluate(() => {
    const deck = document.querySelector(".reading-deck")!.getBoundingClientRect();
    const title = document.querySelector(".focus-titlebar")!.getBoundingClientRect();
    return { fraction: deck.width / title.width, tops: [...document.querySelectorAll(".reading-block")].map(b => b.getBoundingClientRect().top), minHeight: getComputedStyle(document.querySelector(".deck-content")!).minHeight };
  });
  expect(geometry.fraction).toBeGreaterThan(.95);
  expect(Math.max(...geometry.tops) - Math.min(...geometry.tops)).toBeLessThan(2);
  expect(geometry.minHeight).toBe("0px");
  await expect(deck.getByRole("button", { name: "Back", exact: true })).toBeDisabled();
  await deck.locator(".deck-next").click();
  await expect(deck.locator(".reading-block")).toHaveCount(3);
  await expect(deck).toContainText("Cycles and remainder are different.");
  await expect(deck).toContainText("Amounts versus percentages.");
  await expect(deck).toContainText("Take it with you");
  await expect(deck.locator(".formula")).toHaveText(lessons[1].formula!);
  await expect(deck.locator(".deck-page-progress")).toHaveText("Page 2 of 2");
  await expect(page.getByRole("button", { name: "Mark as understood", exact: true })).toHaveAttribute("aria-pressed", "false");
  await deck.getByRole("button", { name: "Explore", exact: true }).click();
  await expect(page.locator(".lab")).toBeVisible();
  await page.getByRole("button", { name: "01 · Learn", exact: true }).click();
  await expect(page.locator(".deck-page-progress")).toHaveText("Page 2 of 2");
});

test("grouping preserves navigation, keyboard operation, and the current page through text-size changes", async ({ page }) => {
  await page.goto("/experimentation/why-randomize");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  await expect(page.locator(".reading-block")).toHaveCount(3);
  await expect(page.locator(".reading-deck")).toContainText("The counterfactual is missing.");
  await page.locator(".deck-next").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".reading-block")).toHaveCount(2);
  await expect(page.locator(".reading-deck")).toContainText("Random assignment makes a fair starting point.");
  await page.getByRole("button", { name: "Increase text size", exact: true }).click();
  await expect(page.locator(".deck-page-progress")).toHaveText("Page 2 of 2");
  await page.locator(".deck-footer").getByRole("button", { name: "Back", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".deck-page-progress")).toHaveText("Page 1 of 2");
  await page.goto("/forecasting/arima");
  await expect(page.locator(".deck-page-progress")).toHaveText("Page 1 of 3");
  const blocks: string[] = [];
  for (let i = 0; i < 3; i++) {
    blocks.push(...await page.locator(".reading-block>p").allTextContents());
    if (i < 2) await page.locator(".deck-next").click();
  }
  const ar = lessons.find(l => l.slug === "arima")!;
  expect(blocks).toEqual([ar.intro, ...ar.points.map(p => p.text), ar.takeaway]);
  await expect(page.locator(".reading-deck .formula")).toHaveCount(1);
});

test("grouped reading stacks on phones, adapts to large text, and leaves Classic intact", async ({ page }) => {
  await page.goto("/forecasting/trend-seasonality-noise");
  await page.getByRole("button", { name: "Lab", exact: true }).click();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Increase text size", exact: true }).click();
  for (const width of [320, 390, 800, 1280, 1720]) {
    await page.setViewportSize({ width, height: 1080 });
    for (const path of ["/forecasting/trend-seasonality-noise", "/forecasting/arima", "/experimentation/why-randomize"]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} at ${width}px / 140%`).toBe(true);
      await expect(page.locator(".reading-block")).toHaveCount(3);
      if (width <= 390) {
        const rects = await page.locator(".reading-block").evaluateAll(nodes => nodes.map(n => ({ top: n.getBoundingClientRect().top, bottom: n.getBoundingClientRect().bottom })));
        expect(rects[1].top).toBeGreaterThanOrEqual(rects[0].bottom - 1);
        expect(rects[2].top).toBeGreaterThanOrEqual(rects[1].bottom - 1);
      }
      while ((await page.locator(".deck-next").textContent())!.startsWith("Next")) {
        await page.locator(".deck-next").click();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} later page at ${width}px / 140%`).toBe(true);
      }
    }
  }
  await page.getByRole("button", { name: "Classic", exact: true }).click();
  await expect(page.locator(".reading-deck")).toHaveCount(0);
  await expect(page.locator(".lesson-content-panel")).toBeVisible();
  await expect(page.locator(".lesson-table tbody tr")).toHaveCount(3);
});
