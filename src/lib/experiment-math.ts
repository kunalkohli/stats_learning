/** Normal CDF approximation (absolute error about 1e-7). */
export function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const density = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  const tail = density * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - tail : tail;
}

export function conversionComparison(n: number, controlConversions: number, treatmentConversions: number) {
  const control = controlConversions / n, treatment = treatmentConversions / n;
  const lift = treatment - control;
  const se = Math.sqrt((control * (1 - control) + treatment * (1 - treatment)) / n);
  const pooled = (control + treatment) / 2;
  const nullSe = Math.sqrt(2 * pooled * (1 - pooled) / n);
  const p = nullSe ? Math.min(1, 2 * normalCdf(-Math.abs(lift / nullSe))) : lift === 0 ? 1 : 0;
  return { control, treatment, lift, relative: control ? lift / control : 0, se, low: lift - 1.96 * se, high: lift + 1.96 * se, p };
}

export function plannedPerArm(baseline: number, absoluteMde: number) {
  return Math.ceil(2 * baseline * (1 - baseline) * (1.96 + 0.841621) ** 2 / absoluteMde ** 2);
}

export function approximatePower(baseline: number, effect: number, n: number) {
  const shift = effect / Math.sqrt(2 * baseline * (1 - baseline) / n);
  return normalCdf(-1.96 - shift) + 1 - normalCdf(1.96 - shift);
}

export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return (state + 0.5) / 4294967296; };
}

/** Known-variance Gaussian approximation, not a fitted or exact binomial test. */
export function simulateEstimates(n: number, effect: number, seed: number, count = 300) {
  const random = seededRandom(seed);
  const se = Math.sqrt(2 * 0.1 * 0.9 / n);
  return Array.from({ length: count }, () => {
    const z = Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
    const estimate = effect + se * z;
    return { estimate, low: estimate - 1.96 * se, high: estimate + 1.96 * se, significant: Math.abs(estimate / se) > 1.96 };
  });
}

export function quantile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))];
}

export function summarize(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return { mean, variance, se: Math.sqrt(variance / values.length) };
}

export function restoreExperimentProgress(value: unknown, max: number) {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const valid = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= max;
  const notes: Record<string, string> = {};
  if (data.notes && typeof data.notes === "object") for (const [key, text] of Object.entries(data.notes)) if (valid(Number(key)) && typeof text === "string") notes[key] = text;
  return { understood: Array.isArray(data.understood) ? [...new Set(data.understood.filter(valid))] : [], notes, lastLesson: valid(data.lastLesson) ? data.lastLesson : 1 };
}
