import { actions } from "astro:actions";
import type { SurveyFromAll } from "@/actions/surveys";

let active = $state<SurveyFromAll | null>(null);
let surveysAndChecklists = $state(await actions.surveys.getAll());

export default {
  get all() {
    return surveysAndChecklists;
  },
  get active() {
    return active;
  },
  refresh: async () => {
    surveysAndChecklists = [];
  },
  setActive: (c: typeof active) => {
    active = c;
  },
};
