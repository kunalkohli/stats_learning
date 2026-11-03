import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReadingPages, type ReadingIdea } from "../src/lib/reading-pages";
import { lessons } from "../src/lib/curriculum";
import { experimentLessons } from "../src/lib/experimentation";

const idea = (points: number): ReadingIdea => ({ intro: "A business setup.", points: Array.from({ length: points }, (_, i) => ({ title: `Idea ${i + 1}`, text: `Explanation ${i + 1}.` })), takeaway: "The takeaway.", formula: "y = a + b\nz = c" });

test("combines the former cards into balanced pages of two or three", () => {
  assert.deepEqual(buildReadingPages(idea(3)).map(p => p.length), [3, 2]);
  assert.deepEqual(buildReadingPages(idea(4)).map(p => p.length), [3, 3]);
  assert.deepEqual(buildReadingPages(idea(5)).map(p => p.length), [3, 2, 2]);
  for (let count = 0; count <= 20; count++) {
    const pages = buildReadingPages(idea(count));
    assert.ok(pages.every(p => p.length >= 2 && p.length <= 3));
    assert.equal(pages.length, Math.ceil((count + 2) / 3));
    assert.deepEqual(pages.flat().map(p => p.number), Array.from({ length: count + 2 }, (_, i) => i + 1));
  }
});

test("preserves every paragraph, its sequence, and one final formula/takeaway across both curricula", () => {
  for (const lesson of [...lessons, ...experimentLessons]) {
    const before = JSON.stringify(lesson), pages = buildReadingPages(lesson), blocks = pages.flat();
    assert.equal(JSON.stringify(lesson), before);
    assert.deepEqual(blocks.map(b => b.text), [lesson.intro, ...lesson.points.map(p => p.text), lesson.takeaway]);
    assert.deepEqual(blocks.slice(1, -1).map(b => b.title), lesson.points.map(p => p.title));
    assert.equal(blocks.filter(b => b.takeaway).length, 1);
    assert.equal(blocks.at(-1)!.takeaway, true);
    assert.equal(blocks.at(-1)!.formula, "formula" in lesson ? lesson.formula : undefined);
    assert.equal(blocks.filter(b => b.formula).length, "formula" in lesson && lesson.formula ? 1 : 0);
    assert.ok(pages.every(p => p.length > 1));
  }
});

test("short ideas stay together and formulas retain original whitespace", () => {
  const pages = buildReadingPages(idea(0));
  assert.equal(pages.length, 1);
  assert.equal(pages[0][0].title, "The setup");
  assert.equal(pages[0][1].title, "Take it with you");
  assert.equal(pages[0][1].formula, "y = a + b\nz = c");
});
