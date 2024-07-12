// Algorithm:
// answers range from 1 - 5
// for "positive" question ids subtract one from the user response
// for "negative" question ids subtract the user response from 5
// sum and multiply the final score by 2.5 to get a score out of 100
// average all the responses to get a final raw score
import { actions } from "astro:actions";
import type { SurveyFromAll } from "@/actions/surveys";
import type { RevisionFromAll, Revisions } from "@/actions/revisions";
import type { RespondentFromAll, Respondents } from "@/actions/respondents";

type SurveyRespondents = Respondents | Revisions[number]["respondents"];
type Surveys =
  | SurveyFromAll
  | RevisionFromAll["survey"]
  | RespondentFromAll["surveys"][number];

export async function calculatePracticeAverageSUSScore() {
  const respondents = await actions.respondents.getAll(undefined);
  const scores = respondents
    .map((r) => {
      const survey = r.surveys.find((s) => s.type === "SUS_PROPOSED");
      return survey && calculateSUSScoreFromRespondent(r, survey);
    })
    .filter(Boolean) as number[];
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length || 0;
}

export function calculateAverageSUSScore(
  respondents: SurveyRespondents,
  survey: Surveys
) {
  const scores = calculateSUSScoreFromRespondents(respondents, survey).filter(
    Boolean
  ) as number[];
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length || 0;
}

export function calculateSUSScoreFromRespondents(
  respondents: SurveyRespondents,
  survey: Surveys
) {
  const scores = respondents
    .map((r) => calculateSUSScoreFromRespondent(r, survey))
    .filter(Boolean);
  return scores;
}

export function calculateSUSScoreFromRespondent(
  respondent: SurveyRespondents[number],
  survey: Surveys
) {
  const responses = respondent.responses.filter(
    (r) => survey?.id === r.surveyId
  );

  if (responses.length !== survey?.questions.length || !responses.length)
    return undefined;

  const score = responses.reduce((score, response) => {
    if (!response.response?.numericalValue) return score;
    return (score += response.question.positive
      ? response.response.numericalValue - 1
      : 5 - response.response.numericalValue);
  }, 0);

  return score * 2.5;
}
