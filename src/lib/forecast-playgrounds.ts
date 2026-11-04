/** Small, reproducible statistical teaching implementations. Never use post-origin values to fit. */
export const MONTHLY_SALES = Array.from({ length: 42 }, (_, t) => {
  const season = [.91, .94, 1, 1.02, 1.01, .98, .96, .99, 1.04, 1.14, 1.38, 1.2][t % 12];
  return 100 * Math.exp(.006 * t + .00012 * t * t) * season + 2 * Math.sin(t * 2.31);
});

export function leastSquares(x: number[][], y: number[]): number[] {
  const p = x[0]?.length ?? 0;
  if (!p || x.length !== y.length || x.some(row => row.length !== p)) throw new Error("Invalid regression inputs.");
  const a = Array.from({ length: p }, (_, j) => [...Array.from({ length: p }, (_, k) => x.reduce((s, row) => s + row[j] * row[k], 0)), x.reduce((s, row, i) => s + row[j] * y[i], 0)]);
  for (let j = 0; j < p; j++) {
    let pivot = j;
    for (let i = j + 1; i < p; i++) if (Math.abs(a[i][j]) > Math.abs(a[pivot][j])) pivot = i;
    if (Math.abs(a[pivot][j]) < 1e-10) throw new Error("Insufficient independent observations.");
    [a[j], a[pivot]] = [a[pivot], a[j]];
    const v = a[j][j]; for (let k = j; k <= p; k++) a[j][k] /= v;
    for (let i = 0; i < p; i++) if (i !== j) { const f = a[i][j]; for (let k = j; k <= p; k++) a[i][k] -= f * a[j][k]; }
  }
  return a.map(row => row[p]);
}

export function monthlyForecast(training: number[], horizon: number, firstMonth = 0) {
  if (training.length < 3 || training.some(v => !Number.isFinite(v) || v <= 0) || !Number.isInteger(horizon) || horizon < 1) throw new Error("Provide positive training values and a positive horizon.");
  const n = training.length;
  if (n >= 12 && n < 24) return { method: "Seasonal naïve · one annual cycle", values: Array.from({ length: horizon }, (_, h) => training[n - 12 + h % 12]) };
  const seasonal = n >= 24;
  const features = (i: number) => [1, i / 12, ...(seasonal ? Array.from({ length: 11 }, (_, m) => (firstMonth + i) % 12 === m ? 1 : 0) : [])];
  const coefficients = leastSquares(training.map((_, i) => features(i)), training.map(Math.log));
  return { method: seasonal ? "Fitted trend + calendar months" : "Fitted short-window trend only", values: Array.from({ length: horizon }, (_, h) => Math.exp(features(n + h).reduce((s, v, j) => s + v * coefficients[j], 0))) };
}

export type BacktestRun = { origin: number; predicted: number[]; actual: number[] };
export function rollingBacktest(values: number[], lastOrigin: number, rolling: boolean): BacktestRun[] {
  if (lastOrigin < 24 || lastOrigin > values.length - 3) throw new Error("Origin needs at least 24 training months and 3 evaluation months.");
  const origins = rolling ? Array.from({ length: lastOrigin - 23 }, (_, i) => i + 24) : [lastOrigin];
  return origins.map(origin => ({ origin, predicted: monthlyForecast(values.slice(0, origin), 3).values, actual: values.slice(origin, origin + 3) }));
}
export function errorsByHorizon(runs: BacktestRun[]) {
  return Array.from({ length: 3 }, (_, h) => runs.reduce((s, run) => s + Math.abs((run.actual[h] - run.predicted[h]) / run.actual[h]) * 100, 0) / runs.length);
}

export type BaselineMethod = "mean" | "naive" | "weekly" | "yearly" | "drift" | "growth";
export function baselineForecast(training: number[], horizon: number, method: BaselineMethod, growth = .18) {
  if (training.length < 2 || !Number.isInteger(horizon) || horizon < 1) throw new Error("Need training history and a positive horizon.");
  const n = training.length, last = training[n - 1], mean = training.reduce((s, v) => s + v, 0) / n;
  const lag = method === "weekly" ? 7 : 364;
  if (["weekly", "yearly", "growth"].includes(method) && n < lag) throw new Error("Not enough seasonal history.");
  return Array.from({ length: horizon }, (_, i) => method === "mean" ? mean : method === "naive" ? last : method === "drift" ? last + (i + 1) * (last - training[0]) / (n - 1) : training[n - lag + i % lag] * (method === "growth" ? (1 + growth) ** (1 + Math.floor(i / lag)) : 1));
}

function randomNormals(n: number, seed = 742) {
  let state = seed >>> 0;
  const uniform = () => { state = (1664525 * state + 1013904223) >>> 0; return (state + .5) / 4294967296; };
  return Array.from({ length: n }, () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform()));
}
export type DiagnosticPattern = "noise" | "memory" | "trend" | "weekly" | "trend-weekly";
export function diagnosticSeries(pattern: DiagnosticPattern, n = 320) {
  const noise = randomNormals(n); let state = 0;
  return noise.map((z, t) => {
    state = .75 * state + z * 4;
    if (pattern === "noise") return 100 + z * 5;
    if (pattern === "memory") return 100 + state;
    return 100 + (pattern === "trend" || pattern === "trend-weekly" ? .35 * t : 0) + (pattern === "weekly" || pattern === "trend-weekly" ? 12 * Math.sin(2 * Math.PI * t / 7) : 0) + z * 3;
  });
}
export const difference = (values: number[]) => values.slice(1).map((v, i) => v - values[i]);
export function correlation(x: number[], y: number[]) {
  if (x.length !== y.length || x.length < 2) return 0;
  const a = x.reduce((s, v) => s + v, 0) / x.length, b = y.reduce((s, v) => s + v, 0) / y.length;
  const xx = x.reduce((s, v) => s + (v - a) ** 2, 0), yy = y.reduce((s, v) => s + (v - b) ** 2, 0);
  return xx && yy ? x.reduce((s, v, i) => s + (v - a) * (y[i] - b), 0) / Math.sqrt(xx * yy) : 0;
}
export const lagCorrelation = (values: number[], lag: number) => correlation(values.slice(lag), values.slice(0, -lag));
export function sampleAcf(values: number[], maxLag = 28) {
  const mean = values.reduce((s, v) => s + v, 0) / values.length, denominator = values.reduce((s, v) => s + (v - mean) ** 2, 0);
  return Array.from({ length: maxLag }, (_, i) => denominator ? values.slice(i + 1).reduce((s, v, j) => s + (v - mean) * (values[j] - mean), 0) / denominator : 0);
}
export function oneStepBaselineErrors(values: number[], start = 256) {
  const errors = [0, 0, 0];
  for (let i = start; i < values.length; i++) {
    const predictions = [values.slice(0, i).reduce((s, v) => s + v, 0) / i, values[i - 1], values[i - 7]];
    predictions.forEach((p, j) => { errors[j] += Math.abs(values[i] - p); });
  }
  return errors.map(v => v / (values.length - start));
}

export type ResidualModel = "mean" | "trend" | "weekdays" | "biased";
export function residualDiagnostics(model: ResidualModel) {
  const values = diagnosticSeries("trend-weekly"), cut = 224;
  const features = (t: number) => [1, ...(model !== "mean" ? [t / 100] : []), ...(["weekdays", "biased"].includes(model) ? Array.from({ length: 6 }, (_, d) => t % 7 === d ? 1 : 0) : [])];
  const coefficients = leastSquares(values.slice(0, cut).map((_, t) => features(t)), values.slice(0, cut));
  const residuals = values.slice(cut).map((v, i) => v - features(cut + i).reduce((s, x, j) => s + x * coefficients[j], 0) - (model === "biased" ? 5 : 0));
  const acf = sampleAcf(residuals), n = residuals.length;
  return { residuals, acf, bias: residuals.reduce((s, v) => s + v, 0) / n, mae: residuals.reduce((s, v) => s + Math.abs(v), 0) / n, q: n * (n + 2) * acf.slice(0, 14).reduce((s, r, i) => s + r * r / (n - i - 1), 0) };
}

export type GrowthChoice = "all" | "recent" | "latest";
export const growthScenarios = {
  accelerating: { rates: [10, 10.5, 12, 13, 13.2, 15, 16, 15.4, 16.8, 17.8], november: 19.2 },
  stable: { rates: [14, 16, 13, 17, 12, 16, 14, 15, 13, 16], november: 15 },
};
export function chooseGrowth(past: number[], method: GrowthChoice) {
  if (!past.length) throw new Error("Provide past growth observations.");
  const selected = method === "all" ? past : method === "recent" ? past.slice(-3) : past.slice(-1);
  return selected.reduce((s, v) => s + v, 0) / selected.length;
}
export function growthBacktest(rates: number[], method: GrowthChoice) {
  const errors = rates.slice(3).map((actual, i) => actual - chooseGrowth(rates.slice(0, i + 3), method));
  return { mae: errors.reduce((s, v) => s + Math.abs(v), 0) / errors.length, bias: errors.reduce((s, v) => s + v, 0) / errors.length };
}
export function metricsExperiment(under: number, noise: number, huge: boolean, closed: boolean) {
  const base = [100, 106, 103, 105, 109, 112, 118, 123, 128, 135, 140, 110];
  const training = [84, 88, 85, 90, 94, 93, 98, 101, 108, 119, 125, 95];
  const pattern = [-1, 1, -.5, .5, -1.5, 1.5, -.8, .8, -.3, .3, -1.2, 1.2];
  const mean = base.reduce((s, v) => s + v, 0) / base.length;
  const predicted = base.map((v, i) => v * (1 - under / 100) + pattern[i] * noise / 100 * mean + (huge && i === 10 ? 100 : 0));
  const actual = base.map((v, i) => closed && i === 4 ? 0 : v);
  const errors = actual.map((v, i) => v - predicted[i]), totalError = errors.reduce((s, v) => s + Math.abs(v), 0);
  const scale = training.slice(1).reduce((s, v, i) => s + Math.abs(v - training[i]), 0) / (training.length - 1);
  return { actual, predicted, mae: totalError / actual.length, rmse: Math.sqrt(errors.reduce((s, v) => s + v * v, 0) / errors.length), bias: errors.reduce((s, v) => s + v, 0) / errors.length, mape: closed ? null : errors.reduce((s, v, i) => s + Math.abs(v / actual[i]), 0) / actual.length * 100, wape: totalError / actual.reduce((s, v) => s + Math.abs(v), 0) * 100, mase: totalError / actual.length / scale, scale };
}

export type HierarchyApproach = "independent" | "bottom-up" | "top-down" | "reconciled";
export function hierarchyForecast(total: number, approach: HierarchyApproach) {
  const base = [52000, 31000, 26000], historicalShares = [.5, .3, .2], sum = base.reduce((s, v) => s + v, 0);
  if (approach === "bottom-up") return { total: sum, parts: base };
  if (approach === "top-down") return { total, parts: historicalShares.map(s => s * total) };
  if (approach === "reconciled") {
    // Projection onto total = sum(parts), with supplied diagonal variances [4,1,1,2].
    const gap = total - sum;
    return { total: total - 4 * gap / 8, parts: base.map((v, i) => v + [1, 1, 2][i] * gap / 8) };
  }
  return { total, parts: base };
}

export function driverExperiment(driverError: number) {
  const noise = randomNormals(180, 1043), visitors = Array.from({ length: 134 }, (_, i) => 20 + 5 * Math.sin(i / 9) + noise[i] * 1.7);
  const orders = visitors.map((v, i) => 20 + 10 * v + noise[i + 40] * 9), cut = 120;
  const coefficients = leastSquares(visitors.slice(0, cut).map(v => [1, v]), orders.slice(0, cut));
  // Supplied synthetic driver forecasts with controlled errors, not learned future observations.
  const supplied = visitors.slice(cut).map((v, i) => v + driverError * noise[i + 6]);
  const honest = supplied.map(v => coefficients[0] + coefficients[1] * v), leaky = visitors.slice(cut).map(v => coefficients[0] + coefficients[1] * v);
  const actual = orders.slice(cut), sigma = Math.sqrt(orders.slice(0, cut).reduce((s, v, i) => s + (v - coefficients[0] - coefficients[1] * visitors[i]) ** 2, 0) / (cut - 2));
  const mae = (predicted: number[]) => actual.reduce((s, v, i) => s + Math.abs(v - predicted[i]), 0) / actual.length;
  return { visitors, orders, honest, leaky, actual, honestMae: mae(honest), leakyMae: mae(leaky), slope: coefficients[1], residualSigma: sigma, halfWidth: 1.281552 * Math.sqrt(sigma ** 2 + coefficients[1] ** 2 * driverError ** 2) };
}

function normalProbability(z: number) {
  const t = 1 / (1 + .2316419 * Math.abs(z));
  const tail = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) * t * (.319381530 + t * (-.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - tail : tail;
}
export function intervalCoverage(level: number, scale: number) {
  if (level <= 0 || level >= 100 || scale <= 0) throw new Error("Invalid interval parameters.");
  let lo = -8, hi = 8;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (normalProbability(mid) < .5 + level / 200) lo = mid; else hi = mid; }
  const z = (lo + hi) / 2, noise = randomNormals(120, 9127);
  const cases = noise.map((error, i) => {
    const mean = 100 + i * .03, sigma = 3 + Math.sqrt(i + 1) * .3, half = z * sigma * scale;
    const actual = mean + sigma * error;
    return { mean, actual, low: mean - half, high: mean + half, inside: actual >= mean - half && actual <= mean + half };
  });
  return { cases, observed: cases.filter(c => c.inside).length / cases.length * 100, z };
}
