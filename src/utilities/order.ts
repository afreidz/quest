type QuestionsWithPosition = {
  [k: string]: any;
  position: number | null;
}[];

export function orderByPosition<T extends QuestionsWithPosition>(items: T) {
  return items.sort((a, b) =>
    !a.position || !b.position ? 0 : a.position - b.position,
  );
}

export type SurveyQuestionGroup = {
  id: string;
  name: string;
  image: string | null;
  questions: SurveyQuestion[];
  position: number | null;
}[];

export type SurveyQuestion = {
  id: string;
  text: string;
  positive: boolean;
  group: string | null;
  position: number | null;
  responses: {
    id: string;
    label: string;
    count?: number;
    value: number | null;
    respondents?: string[];
  }[];
};
