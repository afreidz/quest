import { actions } from "astro:actions";
import type { ClientFromAll } from "@/actions/clients";

let active = $state<ClientFromAll | null>(null);
let clients = $state(await actions.client.getAll());

export default {
  get all() {
    return clients;
  },
  get active() {
    return active;
  },
  refresh: async () => {
    clients = await actions.client.getAll();
  },
  setActive: (c: typeof active) => {
    active = c;
  },
};
