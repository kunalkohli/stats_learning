export type ReadingIdea = {
  intro: string;
  points: { title: string; text: string }[];
  takeaway: string;
  formula?: string;
};

export type ReadingBlock = { number: number; title: string; text: string; formula?: string; takeaway?: boolean };

/** Keep the original sequence, with 2–3 ideas per page and no trailing one-idea page. */
export function buildReadingPages(idea: ReadingIdea): ReadingBlock[][] {
  const blocks: ReadingBlock[] = [
    { number: 1, title: "The setup", text: idea.intro },
    ...idea.points.map((point, i) => ({ number: i + 2, ...point })),
    { number: idea.points.length + 2, title: "Take it with you", text: idea.takeaway, formula: idea.formula, takeaway: true },
  ];
  const pageCount = Math.ceil(blocks.length / 3);
  const baseSize = Math.floor(blocks.length / pageCount), extra = blocks.length % pageCount;
  let cursor = 0;
  return Array.from({ length: pageCount }, (_, i) => {
    const page = blocks.slice(cursor, cursor + baseSize + (i < extra ? 1 : 0));
    cursor += page.length;
    return page;
  });
}
