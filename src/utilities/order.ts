type QuestionsWithPosition = {
  [k: string]: any;
  position: number | null;
}[];

export function orderByPosition<T extends QuestionsWithPosition>(items: T) {
  return items.sort((a, b) =>
    !a.position || !b.position ? 0 : a.position - b.position
  );
}
