import { lessonSentences } from "@/lib/lesson-copy";
import type { ReactNode } from "react";

export function LessonCopy({ text, className = "", prefix }: { text: string; className?: string; prefix?: ReactNode }) {
  const items = lessonSentences(text);
  return items.length > 1
    ? <ul className={`lesson-copy lesson-bullets ${className}`} role="list">{items.map((item, i) => <li key={i}>{i === 0 && prefix}{item}</li>)}</ul>
    : <p className={`lesson-copy ${className}`}>{prefix}{text}</p>;
}
