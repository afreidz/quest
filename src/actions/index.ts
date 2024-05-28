import * as clients from "./clients";
import * as systems from "./systems";
import * as revisions from "./revisions";
import * as respondents from "./respondents";

export const server = {
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
};
