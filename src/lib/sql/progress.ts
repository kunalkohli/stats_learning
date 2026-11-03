import { sqlQuestions } from "./questions";

export const SQL_PROGRESS_KEY = "dsconcepts-sql-progress-v1";
// Keep legacy scratchpad notes intact even though the scratchpad UI was removed.
export type SqlProgress = { drafts: Record<string, string>; notes: Record<string, string>; solved: string[]; lastQuestion: string };
export const emptySqlProgress = (): SqlProgress => ({ drafts: {}, notes: {}, solved: [], lastQuestion: sqlQuestions[0].slug });
export function restoreSqlProgress(value: unknown): SqlProgress {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const valid = new Set(sqlQuestions.map(q => q.slug));
  const strings = (value: unknown, max: number) => {
    const result: Record<string, string> = {};
    if (value && typeof value === "object") for (const [key, text] of Object.entries(value)) if (valid.has(key) && typeof text === "string") result[key] = text.slice(0, max);
    return result;
  };
  return { drafts: strings(input.drafts, 20000), notes: strings(input.notes, 10000), solved: Array.isArray(input.solved) ? [...new Set(input.solved.filter((v): v is string => typeof v === "string" && valid.has(v)))] : [], lastQuestion: typeof input.lastQuestion === "string" && valid.has(input.lastQuestion) ? input.lastQuestion : sqlQuestions[0].slug };
}
