import { test } from "node:test";
import assert from "node:assert/strict";
import { MONTHLY_SALES, monthlyForecast, rollingBacktest, errorsByHorizon, baselineForecast, diagnosticSeries, difference, lagCorrelation, residualDiagnostics, chooseGrowth, growthScenarios, growthBacktest, metricsExperiment, hierarchyForecast, driverExperiment, intervalCoverage, fourierShape, fourierHistory, holtWinters, dhrExperiment } from "../src/lib/forecast-playgrounds";

test("selecting longer history changes the fitted forecast without reading the future", () => {
  const short = monthlyForecast(MONTHLY_SALES.slice(32, 35), 7, 8);
  const long = monthlyForecast(MONTHLY_SALES.slice(2, 35), 7, 2);
  assert.match(short.method, /trend only/); assert.match(long.method, /calendar months/);
  assert.ok(Math.abs(long.values[1] - MONTHLY_SALES[36]) < Math.abs(short.values[1] - MONTHLY_SALES[36]));
  assert.match(monthlyForecast(MONTHLY_SALES.slice(23, 35), 7, 11).method, /Seasonal naïve/);
  assert.throws(() => monthlyForecast([1, 0, 2], 3));
  const changed = [...MONTHLY_SALES]; changed[35] *= 100;
  assert.deepEqual(monthlyForecast(changed.slice(2, 35), 7, 2), long);
});

test("rolling backtests refit prefixes and score every requested horizon", () => {
  const runs = rollingBacktest(MONTHLY_SALES.slice(0, 36), 33, true);
  assert.equal(runs.length, 10); assert.equal(runs.reduce((s, r) => s + r.predicted.length, 0), 30);
  for (const run of runs) assert.deepEqual(run.predicted, monthlyForecast(MONTHLY_SALES.slice(0, run.origin), 3).values);
  const changed = [...MONTHLY_SALES]; for (let i = 33; i < changed.length; i++) changed[i] *= 4;
  assert.deepEqual(rollingBacktest(changed, 33, true).map(r => r.predicted), runs.map(r => r.predicted));
  assert.equal(rollingBacktest(MONTHLY_SALES, 33, false).length, 1);
  assert.deepEqual(errorsByHorizon([{ origin: 24, predicted: [90, 80, 70], actual: [100, 100, 100] }]), [10, 20, 30]);
});

test("baseline forecasts use training values and genuine endpoint drift", () => {
  assert.deepEqual(baselineForecast([10, 20, 30], 2, "mean"), [20, 20]);
  assert.deepEqual(baselineForecast([10, 20, 30], 2, "naive"), [30, 30]);
  assert.deepEqual(baselineForecast([10, 20, 30], 2, "drift"), [40, 50]);
  assert.deepEqual(baselineForecast([1, 2, 3, 4, 5, 6, 7], 9, "weekly"), [1, 2, 3, 4, 5, 6, 7, 1, 2]);
  assert.ok(Math.abs(baselineForecast(Array(364).fill(100), 1, "growth")[0] - 118) < 1e-10);
  assert.throws(() => baselineForecast([1, 2, 3], 4, "weekly"));
});

test("lag correlations expose weekly structure after differencing the constructed trend", () => {
  const raw = diagnosticSeries("trend-weekly"), diff = difference(raw);
  assert.deepEqual(raw, diagnosticSeries("trend-weekly"));
  assert.ok(lagCorrelation(raw, 1) > .8);
  assert.ok(lagCorrelation(diff, 7) > lagCorrelation(diff, 6));
  assert.ok(lagCorrelation(diff, 7) > lagCorrelation(diff, 8));
  assert.ok(Math.abs(lagCorrelation(diagnosticSeries("noise"), 1)) < .2);
});

test("constant forecast bias changes the mean but not centered residual ACF", () => {
  const weekly = residualDiagnostics("weekdays"), biased = residualDiagnostics("biased"), missed = residualDiagnostics("trend");
  assert.equal(weekly.residuals.length, 96);
  assert.ok(Math.abs((biased.bias - weekly.bias) + 5) < 1e-10);
  assert.ok(Math.abs(biased.q - weekly.q) < 1e-8);
  assert.ok(weekly.acf.every((r, i) => Math.abs(r - biased.acf[i]) < 1e-10));
  assert.ok(missed.q > weekly.q);
});

test("growth rules are computed only from prior rates and can lag acceleration", () => {
  assert.equal(chooseGrowth([10, 13, 16, 19], "all"), 14.5);
  assert.equal(chooseGrowth([10, 13, 16, 19], "latest"), 19);
  const rates = growthScenarios.accelerating.rates;
  assert.ok(growthBacktest(rates, "all").bias > growthBacktest(rates, "latest").bias);
});

test("six error metrics distinguish noise, bias, outliers, zeros and a training MASE scale", () => {
  const clean = metricsExperiment(10, 0, false, false), noise = metricsExperiment(10, 10, false, false), zero = metricsExperiment(0, 5, false, true);
  assert.ok(clean.bias > 0); assert.ok(Math.abs(clean.bias - noise.bias) < 1e-10);
  assert.ok(noise.rmse > clean.rmse); assert.equal(zero.mape, null); assert.ok(Number.isFinite(zero.wape));
  assert.ok(Math.abs(noise.mase - noise.mae / noise.scale) < 1e-12);
});

test("hierarchy projection is coherent without pretending to estimate MinT covariance", () => {
  for (const method of ["bottom-up", "top-down", "reconciled"] as const) {
    const r = hierarchyForecast(115000, method); assert.ok(Math.abs(r.total - r.parts.reduce((s, v) => s + v, 0)) < 1e-8);
  }
  assert.equal(hierarchyForecast(115000, "independent").total, 115000);
  assert.equal(hierarchyForecast(115000, "bottom-up").total, 109000);
  assert.equal(hierarchyForecast(115000, "top-down").parts[2], 23000);
});

test("driver uncertainty widens bands and explicitly leaky predictors can flatter scores", () => {
  const perfect = driverExperiment(0), noisy = driverExperiment(6);
  assert.deepEqual(perfect.honest, perfect.leaky);
  assert.deepEqual(noisy.actual, perfect.actual);
  assert.ok(noisy.halfWidth > perfect.halfWidth); assert.ok(noisy.honestMae > noisy.leakyMae);
});

test("Fourier waves improve the known seasonal shape, while six waves overfit one year and settle with five", () => {
  const one = fourierShape(3, 1), three = fourierShape(3, 3), four = fourierShape(3, 4);
  assert.ok(three.rmse < one.rmse && three.r2 > .97);
  assert.ok(four.rmse <= three.rmse);
  const shortThree = fourierHistory(1, 3), shortSix = fourierHistory(1, 6);
  assert.ok(shortThree.nextYearRmse < shortSix.nextYearRmse);
  const longThree = fourierHistory(5, 3), longSix = fourierHistory(5, 6);
  assert.ok(longSix.nextYearRmse < longThree.nextYearRmse);
  assert.equal(fourierHistory(3, 3).observed.length, 156);
  assert.throws(() => fourierHistory(0, 3));
});

test("Holt–Winters stages add level, trend and weekly states with different scaling modes", () => {
  const level = holtWinters("additive", 1, .3), trend = holtWinters("additive", 2, .3), season = holtWinters("additive", 3, .3);
  assert.ok(season.mae < trend.mae && trend.mae < level.mae);
  assert.ok(season.amplitude > 1000 && trend.amplitude === 0);
  assert.ok(season.trend > 80 && season.trend < 160);
  const multiplicative = holtWinters("multiplicative", 3, .3);
  assert.ok(multiplicative.amplitude > 10 && multiplicative.amplitude < 35);
  assert.ok(multiplicative.forecast.every((v, i) => v > 0 && Number.isFinite(v)));
  assert.throws(() => holtWinters("additive", 3, 1));
});

test("DHR's AR(1) error correction lowers held-out error and removes the residual lag-one echo", () => {
  const result = dhrExperiment();
  assert.equal(result.actual.length, 90);
  assert.ok(result.rho > .7 && result.rho < .9);
  assert.ok(result.acfBefore > .5 && Math.abs(result.acfAfter) < .1);
  assert.ok(result.maeAfter < result.maeBefore);
  assert.equal(result.regressionForecast.length, result.arForecast.length);
});

test("coverage counts are computed and respond monotonically to assumed interval width", () => {
  const narrow = intervalCoverage(80, .5), normal = intervalCoverage(80, 1), wide = intervalCoverage(80, 1.8);
  assert.equal(normal.cases.length, 120);
  assert.ok(narrow.observed < normal.observed && normal.observed <= wide.observed);
  assert.ok(normal.observed > 65 && normal.observed < 95);
  assert.equal(normal.observed, normal.cases.filter(c => c.inside).length / 120 * 100);
});
