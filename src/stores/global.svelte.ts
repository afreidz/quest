import { actions } from "astro:actions";

type EntityState<T> = {
  all: T[];
  active: T | null;
  unsaved: boolean;
};

class QuestGlobalStore {
  _clients: EntityState<
    Awaited<ReturnType<typeof actions.client.getAll>>[number]
  > = $state({
    all: [],
    active: null,
    unsaved: false,
  });

  _systems: EntityState<
    Awaited<ReturnType<typeof actions.system.getByClientId>>[number]
  > = $state({
    all: [],
    active: null,
    unsaved: false,
  });

  _revisions: EntityState<
    Awaited<ReturnType<typeof actions.revision.getBySystemId>>[number]
  > & {
    includeBenchmark: boolean;
    compared:
      | Awaited<ReturnType<typeof actions.revision.getBySystemId>>[number]
      | null;
  } = $state({
    all: [],
    active: null,
    unsaved: false,
    compared: null,
    includeBenchmark: true,
  });

  _surveys: EntityState<
    Awaited<ReturnType<typeof actions.surveys.getAll>>[number]
  > = $state({
    all: [],
    active: null,
    unsaved: false,
  });

  get clients(): EntityState<
    Awaited<ReturnType<typeof actions.client.getAll>>[number]
  > {
    return this._clients;
  }

  get systems() {
    return this._systems;
  }

  get revisions() {
    return this._revisions;
  }

  get surveys() {
    return this._surveys;
  }

  setActiveClient(client: typeof this.clients.active) {
    if (this._clients.unsaved) return;
    this._clients.active = client;
    this._revisions.active = null;
    this._systems.active = null;
  }

  async refreshAllClients() {
    this._clients.all = await actions.client.getAll(undefined);
  }

  async refreshActiveClient() {
    if (!this.clients.active) return;
    const newClient = await actions.client.getById(this.clients.active.id);
    this._clients.all = this.clients.all.map((s) =>
      s.id === newClient?.id ? newClient : s
    );
    this._clients.active = newClient;
  }

  setActiveSystem(system: typeof this.systems.active) {
    if (this.systems.unsaved) return;

    if (!system) {
      this._systems.active = null;
      return;
    }

    this._systems.active = system;
  }

  async refreshAllSystems(id?: string) {
    if (!this.clients.active && !id) return;
    this._systems.all = id
      ? await actions.system.getByClientId(id)
      : this.clients.active
        ? await actions.system.getByClientId(this.clients.active.id)
        : [];
  }

  async refreshActiveSystem() {
    if (!this.systems.active) return;
    const newSystem = await actions.system.getById(this.systems.active.id);
    console.log("New system", newSystem);
    this._systems.all = this.systems.all.map((s) =>
      s.id === newSystem?.id ? newSystem : s
    );
    this._systems.active = newSystem;
  }

  setActiveRevision(revision: typeof this.revisions.active) {
    if (this.revisions.unsaved) return;

    if (!revision) {
      this._revisions.active = null;
      return;
    }

    this._revisions.compared = null;
    this._revisions.active = revision;
  }

  setComparedRevision(revision: typeof this.revisions.active) {
    if (!revision) {
      this._revisions.compared = null;
      return;
    }
    this._revisions.compared = revision;
  }

  setIncludeBenchmarkInRevision(v: boolean) {
    this._revisions.includeBenchmark = v;
  }

  async refreshAllRevisions(id?: string) {
    if (!this.systems.active?.id && !id) return;
    this._revisions.all = id
      ? await actions.revision.getBySystemId(id)
      : this.systems.active
        ? await actions.revision.getBySystemId(this.systems.active.id)
        : [];
  }

  async refreshActiveRevision() {
    if (!this.revisions.active) return;
    const newRevision = await actions.revision.getById(
      this.revisions.active.id
    );
    this._revisions.all = this.revisions.all.map((s) =>
      s.id === newRevision?.id ? newRevision : s
    );
    this._revisions.active = newRevision;
  }

  setActiveSurvey(survey: typeof this.surveys.active) {
    if (this.surveys.unsaved) return;

    if (!survey) {
      this._surveys.active = null;
      return;
    }

    this._surveys.active = survey;
  }

  async refreshAllSurveys() {
    this._surveys.all = await actions.surveys.getAll(undefined);
  }

  async refreshActiveSurvey() {
    if (!this.surveys.active) return;
    const newSurvey = await actions.surveys.getById(this.surveys.active.id);
    this._surveys.all = this.surveys.all.map((s) =>
      s.id === newSurvey?.id ? newSurvey : s
    );
    this._surveys.active = newSurvey;
  }
}

export default new QuestGlobalStore();
