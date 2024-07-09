import { actions } from "astro:actions";
import type { SurveyFromAll } from "@/actions/surveys";

let warn = $state(false);
let activeDirty = $state(false);
let active: SurveyFromAll | null = $state(null);
let surveysAndChecklists = $state(await actions.surveys.getAll());

export default {
  get all() {
    return surveysAndChecklists;
  },
  get active() {
    return active;
  },
  get activeDirty() {
    return activeDirty;
  },
  set activeDirty(b: boolean) {
    activeDirty = b;
  },
  refreshAll: async () => {
    surveysAndChecklists = await actions.surveys.getAll();
  },
  refreshActive: async () => {
    if (!active) return;
    const newSurvey = await actions.surveys.getById(active.id);
    surveysAndChecklists = surveysAndChecklists.map((s) =>
      s.id === newSurvey?.id ? newSurvey : s
    );
  },
  setActive: (a: typeof active) => {
    if (activeDirty) return (warn = true);
    active = a;
  },
};
