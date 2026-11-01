import { lessons } from "./curriculum";

export type Progress = { understood: number[]; notes: Record<string, string>; lastLesson: number };

/** v1 had 29 lessons. Two new More models stops shift old practice stops by two. */
export function restoreProgress(value: unknown, legacy = false): Progress {
  const saved = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const max = legacy ? 29 : lessons.length;
  const valid = (id: unknown): id is number => typeof id === "number" && Number.isInteger(id) && id >= 1 && id <= max;
  const translate = (id: number) => legacy && id >= 24 ? id + 2 : id;
  const understood = Array.isArray(saved.understood) ? [...new Set(saved.understood.filter(valid).map(translate))] : [];
  const notes: Record<string, string> = {};
  if (saved.notes && typeof saved.notes === "object") {
    for (const [key, text] of Object.entries(saved.notes)) {
      const id = Number(key);
      if (valid(id) && typeof text === "string") notes[translate(id)] = text;
    }
  }
  return { understood, notes, lastLesson: valid(saved.lastLesson) ? translate(saved.lastLesson) : 1 };
}
