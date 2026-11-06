/** Deterministic teaching data, not a fitted production forecasting model. */
export function blackFriday(year: number): Date {
  const first = new Date(Date.UTC(year, 10, 1));
  const firstThursday = 1 + ((4 - first.getUTCDay() + 7) % 7);
  return new Date(Date.UTC(year, 10, firstThursday + 22));
}

export type SalesOptions = { growth?: number; weekly?: number; holiday?: number; noise?: number; multiplicative?: boolean };
export type SalesPoint = { date: string; sales: number; trend: number; weekly: number; annual: number; event: number; noise: number };

export function generateSales({ growth = 18, weekly = 12, holiday = 140, noise = 5, multiplicative = true }: SalesOptions = {}): SalesPoint[] {
  const start = Date.UTC(2023, 0, 1);
  const weekday = [0.07, 0.04, 0.01, -0.03, -0.06, 0.05, -0.08];
  return Array.from({ length: 1096 }, (_, i) => {
    const date = new Date(start + i * 86400000);
    const trend = 24000 * (1 + growth / 100) ** (i / 365.25);
    const scale = multiplicative ? trend : 24000;
    const weeklyPart = scale * weekday[date.getUTCDay()] * weekly / 12;
    const dayOfYear = (date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 1)) / 86400000;
    const annual = scale * (0.07 * Math.cos((dayOfYear - 335) * Math.PI * 2 / 365.25));
    const distance = (date.getTime() - blackFriday(date.getUTCFullYear()).getTime()) / 86400000;
    // Event-relative window: Black Friday through Cyber Monday, not a fixed date.
    const event = scale * holiday / 100 * (Math.exp(-(distance ** 2) / 5) + 0.35 * Math.exp(-((distance - 3) ** 2) / 2));
    const random = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    const residual = (random - Math.floor(random) - 0.5) * 2 * noise / 100 * scale;
    return { date: date.toISOString().slice(0, 10), sales: trend + weeklyPart + annual + event + residual, trend, weekly: weeklyPart, annual, event, noise: residual };
  });
}

export function movingAverage(values: number[], period = 7): (number | null)[] {
  const half = Math.floor(period / 2);
  return values.map((_, i) => i < half || i >= values.length - half ? null : values.slice(i - half, i + half + 1).reduce((a, b) => a + b, 0) / period);
}

export function metrics(actual: number[], predicted: number[]) {
  if (!actual.length || actual.length !== predicted.length) throw new Error("Provide equal, nonempty series.");
  const errors = actual.map((a, i) => a - predicted[i]);
  return { mae: errors.reduce((s, e) => s + Math.abs(e), 0) / errors.length, rmse: Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length), bias: errors.reduce((s, e) => s + e, 0) / errors.length };
}

export const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value);
