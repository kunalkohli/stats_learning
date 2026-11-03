import { test } from "node:test";
import assert from "node:assert/strict";
import { lessons } from "../src/lib/curriculum";
import { experimentLessons } from "../src/lib/experimentation";
import { getLessonTeaching, forecastCaseStudy } from "../src/lib/lesson-teaching";

test("all 55 lessons have authored emoji-led Northstar examples without changing source content", () => {
  for (const [journey, items] of [["forecasting", lessons], ["experimentation", experimentLessons]] as const) for (const lesson of items) {
    const before = JSON.stringify(lesson), teaching = getLessonTeaching(journey, lesson);
    assert.equal(teaching.pointExamples.length, lesson.points.length);
    assert.ok(teaching.pointExamples.every(p => p.emoji && p.example.length > 50));
    assert.ok(teaching.table.rows.every(r => r.concept && r.meaning && r.emoji && r.example));
    if (lesson.slug !== "trend-seasonality-noise") assert.deepEqual(teaching.table.rows.map(r => r.meaning), lesson.points.map(p => p.text));
    assert.equal(JSON.stringify(lesson), before);
  }
  assert.throws(() => getLessonTeaching("forecasting", { slug: "new-lesson-needs-examples", title: "New", intro: "", points: [] }), /Missing teaching examples/);
});

test("components distinguish cycles from remainder and preserve additive/multiplicative scale guidance", () => {
  const teaching = getLessonTeaching("forecasting", lessons[1]);
  assert.equal(teaching.table.firstColumn, "Component");
  assert.equal(teaching.table.meaningColumn, "What it is");
  assert.deepEqual(teaching.table.rows.map(r => r.concept), ["Trend", "Seasonality", "Cycle", "Remainder"]);
  assert.match(teaching.table.rows[1].meaning, /exact date moves/);
  assert.match(teaching.table.rows[2].meaning, /non-fixed period/);
  assert.match(teaching.table.rows[3].meaning, /not automatically.*white noise/);
  assert.deepEqual(teaching.secondary!.rows.map(r => r.concept), ["Additive", "Multiplicative"]);
  assert.match(teaching.secondary!.rows[1].meaning, /Logs of positive values/);
});

test("the first lesson explains the decision, future outcomes, assumptions, and planning limitations", () => {
  assert.match(lessons[0].intro, /operations team/);
  assert.match(lessons[0].intro, /next Tuesday/);
  const teaching = getLessonTeaching("forecasting", lessons[0]);
  assert.equal(teaching.caseStudy, forecastCaseStudy);
  const text = forecastCaseStudy.rows.map(r => r.text).join(" ");
  assert.match(text, /\$32,000/);
  assert.match(text, /illustrative teaching number/);
  assert.match(text, /80%.*repeated forecasts/);
  assert.match(text, /order counts, units, product mix/);
  assert.match(text, /not revenue alone/);
});
