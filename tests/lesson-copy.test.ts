import { test } from "node:test";
import assert from "node:assert/strict";
import { lessonSentences } from "../src/lib/lesson-copy";
import { lessons } from "../src/lib/curriculum";
import { experimentLessons } from "../src/lib/experimentation";
import { getLessonTeaching, forecastCaseStudy } from "../src/lib/lesson-teaching";

test("lesson bullets keep decimals, formulas, questions, and punctuation intact", () => {
  assert.deepEqual(lessonSentences("Use α = 0.3 and p < 0.05. Is that enough? No—check the holdout."), [
    "Use α = 0.3 and p < 0.05. ", "Is that enough? ", "No—check the holdout.",
  ]);
  assert.deepEqual(lessonSentences("A single short explanation."), ["A single short explanation."]);
  assert.deepEqual(lessonSentences(""), []);
});

test("bullet formatting preserves all authored lesson copy and its order", () => {
  const copy = [forecastCaseStudy.description, ...forecastCaseStudy.rows.map(row => row.text)];
  for (const [journey, items] of [["forecasting", lessons], ["experimentation", experimentLessons]] as const) {
    for (const lesson of items) {
      const teaching = getLessonTeaching(journey, lesson);
      copy.push(lesson.intro, ...lesson.points.map(point => point.text));
      if (teaching.why) copy.push(teaching.why);
      if (teaching.how) copy.push(...teaching.how.map(item => item.text));
      for (const table of [teaching.table, teaching.overview, teaching.secondary]) {
        if (table) for (const row of table.rows) copy.push(row.meaning, row.example);
      }
      if (teaching.baselineComparison) copy.push(...teaching.baselineComparison.map(row => row.example));
    }
  }
  for (const text of copy) assert.equal(lessonSentences(text).join(""), text);
  assert.equal(lessonSentences(lessons[0].intro).length, 4);
});
