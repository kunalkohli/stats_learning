export const DEFAULT_TEXT_SIZE = 90;
export const MIN_TEXT_SIZE = 70;
export const MAX_TEXT_SIZE = 140;
export const TEXT_SIZE_STEP = 10;

export function restoreTextSize(value: unknown): number {
  const size = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof size === "number" && Number.isInteger(size) && size >= MIN_TEXT_SIZE && size <= MAX_TEXT_SIZE && size % TEXT_SIZE_STEP === 0 ? size : DEFAULT_TEXT_SIZE;
}
