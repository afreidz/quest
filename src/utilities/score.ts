// Algorithm:
// answers range from 1 - 5
// for "positive" question ids subtract one from the user response
// for "negative" question ids subtract the user response from 5
// sum and multiply the final score by 2.5 to get a score out of 100
// average all the responses to get a final raw score

import type { Respondents } from "@/actions/respondents";

export function calculateAverageSUSScore(
  respondents: Respondents,
  surveyId?: string | null
) {
  if (!surveyId) throw new Error("Survey Id required to calculate score");
  const scores = calculateSUSScoreFromRespondents(respondents, surveyId);
  return scores.reduce((a, b) => a + b, 0) / scores.length || 0;
}

export function calculateSUSScoreFromRespondents(
  respondents: Respondents,
  surveyId?: string | null
) {
  if (!surveyId) throw new Error("Survey Id required to calculate score");
  const scores = respondents.map((r) =>
    calculateSUSScoreFromRespondent(r, surveyId)
  );
  return scores;
}

export function calculateSUSScoreFromRespondent(
  respondent: Respondents[number],
  surveyId?: string | null
) {
  if (!surveyId) throw new Error("Survey Id required to calculate score");
  const responses = respondent.responses.filter((r) => surveyId === r.surveyId);

  const score = responses.reduce((score, response) => {
    if (!response.response?.numericalValue) return score;
    return (score += response.question.positive
      ? response.response.numericalValue - 1
      : 5 - response.response.numericalValue);
  }, 0);

  return score * 2.5;
}
