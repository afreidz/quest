import { actions } from "astro:actions";
import type { Revisions } from "@/actions/revisions";

let revisions = $state<Revisions | null>(null);
let active = $state<Revisions[number] | null>(null);

export default {
  get all() {
    return revisions;
  },
  get active() {
    return active;
  },
  refresh: async (systemId: string) => {
    revisions = await actions.revision.getBySystemId(systemId);

    if (!active) active = revisions[0];

    return revisions;
  },
  setActive: (c: typeof active) => {
    active = c;
  },
};
