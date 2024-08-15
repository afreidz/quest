import * as me from "./me";
import * as tokens from "./tokens";
import * as clients from "./clients";
import * as systems from "./systems";
import * as surveys from "./surveys";
import * as sessions from "./sessions";
import * as revisions from "./revisions";
import * as utterances from "./utterance";
import * as recordings from "./recordings";
import * as respondents from "./respondents";

export const server = {
  public: {
    getComsToken: tokens.getComsToken,
    respondToSurveyQuestion: surveys.respondToQuestion,
    createRespondentUtterance: utterances.createRespondentUtterance,
  },
  me: {
    ...me,
  },
  client: {
    ...clients,
  },
  system: {
    ...systems,
  },
  revision: {
    ...revisions,
  },
  respondents: {
    ...respondents,
  },
  surveys: {
    ...surveys,
  },
  sessions: {
    ...sessions,
  },
  utterances: {
    ...utterances,
  },
  tokens: {
    ...tokens,
  },
  recording: {
    ...recordings,
  },
};
