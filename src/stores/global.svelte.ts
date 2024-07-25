import { actions } from "astro:actions";
import messages from "./messages.svelte";

type EntityState<T> = {
  all: T[];
  active: T | null;
  unsaved: boolean;
};

class QuestGlobalStore {
  _me: Partial<Awaited<ReturnType<typeof actions.me.getSession>>> = $state({});

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

  _sessions: EntityState<
    Awaited<ReturnType<typeof actions.sessions.getAll>>[number]
  > = $state({
    all: [],
    active: null,
    unsaved: false,
  });

  get me() {
    return this._me;
  }

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

  get sessions() {
    return this._sessions;
  }

  async refreshMe() {
    const me = await actions.me.getSession().catch((err) => {
      messages.error("Unable to get current user details", err.message);
      return null;
    });
    this._me = me;
  }

  setActiveClient(client: typeof this.clients.active) {
    if (this._clients.unsaved) return;
    this._clients.active = client;
    this._revisions.active = null;
    this._systems.active = null;
  }

  async refreshAllClients() {
    this._clients.all = await actions.client.getAll({}).catch((err) => {
      messages.error("Unable to refresh clients", err.message);
      return [];
    });
  }

  async refreshActiveClient() {
    if (!this.clients.active) return;

    const newClient = await actions.client
      .getById(this.clients.active.id)
      .catch((err) => {
        messages.error("Unable to refresh active client", err.message);
        return null;
      });

    if (!newClient) {
      this._clients.active = null;
      return;
    }

    this._clients.all = this.clients.all.map((s) =>
      s.id === newClient?.id ? newClient : s,
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
      ? await actions.system.getByClientId(id).catch((err) => {
          messages.error("Unable to refresh systems", err.message);
          return [];
        })
      : this.clients.active
        ? await actions.system
            .getByClientId(this.clients.active.id)
            .catch((err) => {
              messages.error("Unable to refresh systems", err.message);
              return [];
            })
        : [];
  }

  async refreshActiveSystem() {
    if (!this.systems.active) return;

    const newSystem = await actions.system
      .getById(this.systems.active.id)
      .catch((err) => {
        messages.error("Unable to refresh active system", err.message);
        return null;
      });

    if (!newSystem) {
      this._systems.active = null;
      return;
    }

    this._systems.all = this.systems.all.map((s) =>
      s.id === newSystem?.id ? newSystem : s,
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
      ? await actions.revision.getBySystemId(id).catch((err) => {
          messages.error("Unable to refresh revisions", err.message);
          return [];
        })
      : this.systems.active
        ? await actions.revision
            .getBySystemId(this.systems.active.id)
            .catch((err) => {
              messages.error("Unable to refresh revisions", err.message);
              return [];
            })
        : [];
  }

  async refreshActiveRevision() {
    if (!this.revisions.active) return;

    const newRevision = await actions.revision
      .getById(this.revisions.active.id)
      .catch((err) => {
        messages.error("Unable to refresh active revision", err.message);
        return null;
      });

    if (!newRevision) {
      this._revisions.active = null;
      return;
    }

    this._revisions.all = this.revisions.all.map((s) =>
      s.id === newRevision?.id ? newRevision : s,
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
    this._surveys.all = await actions.surveys.getAll({}).catch((err) => {
      messages.error("Unable to refresh surveys", err.message);
      return [];
    });
  }

  async refreshActiveSurvey() {
    if (!this.surveys.active) return;

    const newSurvey = await actions.surveys
      .getById(this.surveys.active.id)
      .catch((err) => {
        messages.error("Unable to refresh active survey", err.message);
        return null;
      });

    if (!newSurvey) {
      this._surveys.active = null;
      return;
    }

    this._surveys.all = this.surveys.all.map((s) =>
      s.id === newSurvey?.id ? newSurvey : s,
    );
    this._surveys.active = newSurvey;
  }

  async refreshAllSessions() {
    this._sessions.all = await actions.sessions.getAll({}).catch((err) => {
      messages.error("Unable to refresh sessions", err.message);
      return [];
    });
  }

  setActiveSession(session: typeof this.sessions.active) {
    if (this.sessions.unsaved) return;

    if (!session) {
      this._sessions.active = null;
      return;
    }

    this._sessions.active = session;
  }

  async refreshActiveSession() {
    if (!this.sessions.active) return;

    const newSession = await actions.sessions
      .getById(this.sessions.active.id)
      .catch((err) => {
        messages.error("Unable to refresh systems", err.message);
        return null;
      });

    if (!newSession) {
      this._sessions.active = null;
      return;
    }

    this._sessions.all = this.sessions.all.map((s) =>
      s.id === newSession?.id ? newSession : s,
    );
    this._sessions.active = newSession;
  }
}

export default new QuestGlobalStore();
