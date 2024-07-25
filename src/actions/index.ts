import * as me from "./me";
import * as coms from "./coms";
import * as clients from "./clients";
import * as systems from "./systems";
import * as surveys from "./surveys";
import * as sessions from "./sessions";
import * as revisions from "./revisions";
import * as respondents from "./respondents";

export const server = {
  public: {
    getComsToken: coms.getComsToken,
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
};
