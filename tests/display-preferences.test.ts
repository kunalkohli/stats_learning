import { test } from "node:test";
import assert from "node:assert/strict";
import { restoreTextSize } from "../src/lib/display-preferences";
import { experimentGuide } from "../src/lib/journey-guides";
import { experimentLessons } from "../src/lib/experimentation";

test("text size starts at 90%, accepts bounded ten-point steps, and rejects corrupt values", () => {
  for (const size of [70, 80, 90, 100, 110, 120, 130, 140]) {
    assert.equal(restoreTextSize(size), size);
    assert.equal(restoreTextSize(String(size)), size);
  }
  for (const value of [null, undefined, "", "bogus", "90px", " 100 ", 69, 150, 95, 100.5, Infinity, NaN, {}, true]) assert.equal(restoreTextSize(value), 90);
});

test("every experiment playground has actionable guided steps", () => {
  for (const lesson of experimentLessons) {
    const guide = experimentGuide(lesson.lab);
    assert.ok(guide.title);
    assert.equal(guide.steps.length, 2);
    assert.ok(guide.steps.every(s => s.length > 40));
  }
});
