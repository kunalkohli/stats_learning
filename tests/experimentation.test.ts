import { test } from "node:test";
import assert from "node:assert/strict";
import { experimentLessons, experimentParts } from "../src/lib/experimentation";
import { approximatePower, conversionComparison, normalCdf, plannedPerArm, quantile, restoreExperimentProgress, simulateEstimates, summarize } from "../src/lib/experiment-math";

test("all 24 experimentation lessons have a complete teaching path", () => {
  assert.equal(experimentLessons.length, 24);
  assert.equal(new Set(experimentLessons.map(l => l.slug)).size, 24);
  for (const [i, lesson] of experimentLessons.entries()) {
    assert.equal(lesson.id, i + 1);
    assert.equal(lesson.points.length, 3);
    assert.equal(lesson.choices.length, 3);
    assert.ok(lesson.choices[lesson.correct] && lesson.answer && lesson.takeaway && lesson.lab);
    assert.ok(lesson.id >= experimentParts[lesson.part].range[0] && lesson.id <= experimentParts[lesson.part].range[1]);
  }
  assert.equal(experimentLessons.at(-1)?.lab, "workflow");
});

test("conversion distinguishes relative lift, percentage points, and precision", () => {
  const result = conversionComparison(200000, 20000, 20400);
  assert.ok(Math.abs(result.lift - 0.002) < 1e-12);
  assert.ok(Math.abs(result.relative - 0.02) < 1e-12);
  assert.ok(result.low > 0 && result.p < 0.05);
  const smaller = conversionComparison(1000, 100, 102);
  assert.ok(smaller.low < 0 && smaller.p > 0.05);
  assert.ok(smaller.se > result.se);
  assert.ok(Math.abs(normalCdf(0) - 0.5) < 1e-7);
  assert.ok(Math.abs(normalCdf(1.96) - 0.975) < 0.00001);
});

test("power planning uses per-arm counts and inverse-square MDE scaling", () => {
  const n = plannedPerArm(0.1, 0.002);
  assert.ok(n > 350000 && n < 354000);
  assert.ok(Math.abs(approximatePower(0.1, 0.002, n) - 0.8) < 0.001);
  assert.ok(Math.abs(plannedPerArm(0.1, 0.001) / n - 4) < 0.0001);
  assert.ok(approximatePower(0.1, 0.002, 10000) < approximatePower(0.1, 0.002, 100000));
});

test("simulations reproduce, cover the true null, and show winner selection", () => {
  assert.deepEqual(simulateEstimates(3000, 0.002, 42), simulateEstimates(3000, 0.002, 42));
  assert.notDeepEqual(simulateEstimates(3000, 0.002, 42), simulateEstimates(3000, 0.002, 43));
  const nulls = simulateEstimates(3000, 0, 42, 20000);
  const rejectionRate = nulls.filter(t => t.significant).length / nulls.length;
  assert.ok(rejectionRate > 0.04 && rejectionRate < 0.06);
  const trials = simulateEstimates(3000, 0.002, 42, 10000);
  const winners = trials.filter(t => t.low > 0);
  assert.ok(winners.length > 0);
  assert.ok(winners.reduce((a, t) => a + t.estimate, 0) / winners.length > 0.002);
});

test("quantiles, sample summaries, and independent progress normalization are correct", () => {
  assert.equal(quantile([10, 2, 4, 8, 6], 0.5), 6);
  assert.deepEqual(summarize([1, 2, 3]), { mean: 2, variance: 1, se: Math.sqrt(1 / 3) });
  const value = { understood: [1, 1, 24, 31, "2"], notes: { 1: "Keep this", 24: "Workflow", 31: "Forecasting ID", 2: 42 }, lastLesson: 31 };
  assert.deepEqual(restoreExperimentProgress(value, 24), { understood: [1, 24], notes: { 1: "Keep this", 24: "Workflow" }, lastLesson: 1 });
});
