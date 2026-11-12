const sentences = new Intl.Segmenter("en", { granularity: "sentence" });

/** Keep punctuation and whitespace intact; decimals and formulas are not sentence breaks. */
export function lessonSentences(text: string): string[] {
  return Array.from(sentences.segment(text), part => part.segment);
}
