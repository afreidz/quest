import { actions } from "astro:actions";
import type { Revisions } from "@/actions/revisions";

let active = $state<Revisions>([]);
let revisions = $state<Revisions | null>(null);

export default {
  get all() {
    return revisions;
  },
  get active() {
    return active;
  },
  refresh: async (systemId: string) => {
    revisions = await actions.revision.getBySystemId(systemId);

    if (!active.length) active = [revisions[0]];

    return revisions;
  },
  setActive: (c: typeof active) => {
    active = c;
  },
};
