import { actions } from "astro:actions";
import type { Revisions } from "@/actions/revisions";

let active = $state<Revisions>([]);
let revisions = $state<Revisions>([]);

export default {
  get all() {
    return revisions;
  },
  get active() {
    return active;
  },
  refresh: async (systemId: string) => {
    revisions = await actions.revision.getBySystemId(systemId);
    return revisions;
  },
  setActive: (c: typeof active) => {
    active = c;
  },
};
