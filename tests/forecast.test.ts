import { test } from "node:test";
import assert from "node:assert/strict";
import { blackFriday, generateSales, metrics, movingAverage } from "../src/lib/forecast";
import { lessons, parts } from "../src/lib/curriculum";
import { workflowSteps, modelBranches } from "../src/lib/workflow";
import { restoreProgress } from "../src/lib/progress";
import { comparisonRows } from "../src/lib/model-comparison";

test("Black Friday tracks the fourth Thursday, including 53-week gaps", () => {
  const expected = { 2023: "2023-11-24", 2024: "2024-11-29", 2025: "2025-11-28", 2026: "2026-11-27", 2027: "2027-11-26" };
  for (const [year, date] of Object.entries(expected)) {
    assert.equal(blackFriday(Number(year)).toISOString().slice(0, 10), date);
    assert.equal(blackFriday(Number(year)).getUTCDay(), 5);
  }
  assert.equal((blackFriday(2024).getTime() - blackFriday(2023).getTime()) / 86400000, 371);
});
test("all 31 stops have original content, an answer, a lab, and reading links", () => {
  assert.equal(lessons.length, 31);
  assert.equal(new Set(lessons.map(l => l.slug)).size, lessons.length);
  lessons.forEach((l, i) => {
    assert.equal(l.id, i + 1);
    assert.ok(l.points.length >= 3);
    assert.ok(l.choices[l.correct]);
    assert.ok(l.lab && l.source && l.takeaway);
    assert.ok(l.id >= parts[l.part].range[0] && l.id <= parts[l.part].range[1]);
  });
});
test("the workflow is the final In practice stop and revisits valid lessons", () => {
  const workflow = lessons.at(-1)!;
  assert.equal(workflow.id, 31);
  assert.equal(workflow.part, 5);
  assert.equal(workflow.lab, "workflow");
  assert.equal(parts[5].range[1], lessons.length);
  assert.equal(workflowSteps.length, 8);
  assert.equal(new Set(modelBranches.map(b => b.id)).size, modelBranches.length);
  for (const entry of [...workflowSteps, ...modelBranches]) {
    assert.ok(entry.refs.length > 0);
    for (const ref of entry.refs) assert.ok(lessons.some(l => l.id === ref));
  }
  assert.ok(modelBranches.find(b => b.id === "northstar")?.candidate.includes("Fourier"));
});
test("new seasonal model lessons belong to More models and preserve old progress", () => {
  assert.equal(lessons.find(l => l.slug === "mstl-ets")?.part, 4);
  assert.equal(lessons.find(l => l.slug === "prophet-dhr-mstl")?.part, 4);
  const previous = { understood: [20, 24, 29], notes: { 24: "My intervals note", 29: "My workflow note" }, lastLesson: 29 };
  const restored = restoreProgress(previous, true);
  assert.deepEqual(restored.understood, [20, 26, 31]);
  assert.equal(restored.notes[26], "My intervals note");
  assert.equal(restored.notes[31], "My workflow note");
  assert.equal(restored.lastLesson, 31);
  assert.deepEqual(restoreProgress(restored), restored);
  assert.ok(comparisonRows.some(row => row.topic === "Strengths"));
  assert.ok(comparisonRows.some(row => row.topic === "Weaknesses"));
  for (const row of comparisonRows) assert.ok(row.prophet && row.dhr && row.mstl);
});
test("simulated sales are deterministic, continuous, and reconstruct from components", () => {
  const data = generateSales();
  assert.deepEqual(data, generateSales());
  assert.equal(data.length, 1096);
  assert.equal(data.at(-1)?.date, "2025-12-31");
  for (const d of data) {
    assert.ok(d.sales > 0 && Number.isFinite(d.sales));
    assert.ok(Math.abs(d.sales - (d.trend + d.weekly + d.annual + d.event + d.noise)) < 1e-8);
  }
  const bf = data.find(d => d.date === "2024-11-29")!;
  assert.ok(bf.event > bf.trend);
  assert.ok(generateSales({ holiday: 0 }).every(d => d.event === 0));
});
test("zero growth and noise behave as stated", () => {
  assert.ok(generateSales({ growth: 0 }).every(d => d.trend === 24000));
  assert.ok(generateSales({ noise: 0 }).every(d => d.noise === 0));
});
test("centered 7-day average excludes unavailable ends", () => {
  const result = movingAverage([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(result, [null, null, null, 4, 5, 6, null, null, null]);
});
test("error metrics distinguish absolute miss, big misses, and bias", () => {
  assert.deepEqual(metrics([1, 3], [2, 2]), { mae: 1, rmse: 1, bias: 0 });
  const result = metrics([10, 10, 40], [10, 10, 10]);
  assert.equal(result.mae, 10);
  assert.ok(result.rmse > result.mae);
  assert.equal(result.bias, 10);
  assert.throws(() => metrics([], []));
});
