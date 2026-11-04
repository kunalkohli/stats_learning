export type ReadingIdea = {
  intro: string;
  points: { title: string; text: string }[];
  takeaway: string;
  formula?: string;
};

export type ReadingBlock = { number: number; title: string; text: string; formula?: string; takeaway?: boolean };

/** Short cards on one page: setup, at most two concepts per card, then the takeaway. */
export function buildReadingPages(idea: ReadingIdea): ReadingBlock[][] {
  const blocks: ReadingBlock[] = [
    { number: 1, title: "The setup", text: idea.intro },
    ...idea.points.map((point, i) => ({ number: i + 2, ...point })),
    { number: idea.points.length + 2, title: "Remember this", text: idea.takeaway, formula: idea.formula, takeaway: true },
  ];
  const cards: ReadingBlock[][] = [blocks.slice(0, idea.points.length ? 2 : 1)];
  for (let i = 2; i < blocks.length - 1; i += 2) cards.push(blocks.slice(i, Math.min(i + 2, blocks.length - 1)));
  cards.push([blocks[blocks.length - 1]]);
  return cards;
}
