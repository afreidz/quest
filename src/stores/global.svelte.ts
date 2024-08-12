import { actions } from "astro:actions";
import messages from "./messages.svelte";
import type { User } from "@/actions/me";
import type { Surveys } from "@/actions/surveys";
import type { Clients } from "@/actions/clients";
import type { Systems } from "@/actions/systems";
import type { Sessions } from "@/actions/sessions";
import type { Revisions } from "@/actions/revisions";
import type { Recordings } from "@/actions/recordings";
import { preloadVideos } from "@/utilities/video";

type EntityState<T> = {
  all: T[];
  active: T | null;
  unsaved: boolean;
};

class QuestGlobalStore {
  _me: Partial<User> | null = $state();

  _clients: EntityState<Clients[number]> = $state({
    all: [],
    active: null,
    unsaved: false,
  });

  _systems: EntityState<Systems[number]> = $state({
    all: [],
    active: null,
    unsaved: false,
  });

  _revisions: EntityState<Revisions[number]> & {
    includeBenchmark: boolean;
    compared: Awaited<Revisions>[number] | null;
  } = $state({
    all: [],
    active: null,
    unsaved: false,
    compared: null,
    includeBenchmark: true,
  });

  _surveys: EntityState<Surveys[number]> = $state({
    all: [],
    active: null,
    unsaved: false,
  });

  _sessions: EntityState<Sessions[number]> = $state({
    all: [],
    active: null,
    unsaved: false,
    activeRecording: null,
  });

  _recordings: EntityState<Recordings[number]> & {
    preloaded: Record<string, string>;
  } = $state({
    all: [],
    active: null,
    preloaded: {},
    unsaved: false,
  });

  get me() {
    return this._me;
  }

  get clients() {
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

  get recordings() {
    return this._recordings;
  }

  async refreshMe() {
    const me = await actions.me.getSession({});

    if (me.error || !me.data)
      messages.error("Unable to get current user details", me.error);

    this._me = me?.data ?? null;
  }

  setActiveClient(client: typeof this.clients.active) {
    if (this._clients.unsaved) return;
    this._clients.active = client;
    this._revisions.active = null;
    this._systems.active = null;
  }

  async refreshAllClients() {
    const all = await actions.client.getAll({});

    if (all.error || !all.data)
      messages.error("Unable to refresh clients", all.error);

    this._clients.all = all.data || [];
  }

  async refreshActiveClient() {
    if (!this.clients.active) return;

    const refreshed = await actions.client.getById(this.clients.active.id);

    if (refreshed.error) {
      messages.error("Unable to refresh active client", refreshed.error);
      this._clients.active = null;
      return;
    }

    this._clients.all = this.clients.all.map((s) =>
      s.id === refreshed.data?.id ? refreshed.data : s,
    );
    this._clients.active = refreshed.data;
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

    const all = id
      ? await actions.system.getByClientId(id)
      : this.clients.active
        ? await actions.system.getByClientId(this.clients.active.id)
        : { data: [], error: null };

    if (all.error) messages.error("Unable to refresh systems", all.error);

    this._systems.all = all.data ?? [];
  }

  async refreshActiveSystem() {
    if (!this.systems.active) return;

    const refreshed = await actions.system.getById(this.systems.active.id);

    if (refreshed.error) {
      messages.error("Unable to refresh active system", refreshed.error);
      this._systems.active = null;
      return;
    }

    this._systems.all = this.systems.all.map((s) =>
      s.id === refreshed.data?.id ? refreshed.data : s,
    );
    this._systems.active = refreshed.data;
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

    const all = id
      ? await actions.revision.getBySystemId(id)
      : this.systems.active
        ? await actions.revision.getBySystemId(this.systems.active.id)
        : { data: [], error: null };

    if (all.error) messages.error("Unable to refresh revisions", all.error);

    this._revisions.all = all.data ?? [];
  }

  async refreshActiveRevision() {
    if (!this.revisions.active) return;

    const refreshed = await actions.revision.getById(this.revisions.active.id);

    if (refreshed.error) {
      messages.error("Unable to refresh active revision", refreshed.error);
      this._systems.active = null;
      return;
    }

    this._revisions.all = this.revisions.all.map((s) =>
      s.id === refreshed.data?.id ? refreshed.data : s,
    );
    this._revisions.active = refreshed.data;
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
    const all = await actions.surveys.getAll({});

    if (all.error) messages.error("Unable to refresh all surveys", all.error);

    this._surveys.all = all.data ?? [];
  }

  async refreshActiveSurvey() {
    if (!this.surveys.active) return;

    const refreshed = await actions.surveys.getById(this.surveys.active.id);

    if (refreshed.error) {
      messages.error("Unable to refresh active survey", refreshed.error);
      this._surveys.active = null;
      return;
    }

    this._surveys.all = this.surveys.all.map((s) =>
      s.id === refreshed.data?.id ? refreshed.data : s,
    );
    this._surveys.active = refreshed.data;
  }

  async refreshAllSessions() {
    const all = await actions.sessions.getAll({});

    if (all.error) messages.error("Unable to refresh sessions");

    this._sessions.all = all.data ?? [];
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

    const refreshed = await actions.sessions.getById(this.sessions.active.id);

    if (refreshed.error) {
      messages.error("Unable to refresh active session", refreshed.error);
      this._sessions.active = null;
      return;
    }

    this._sessions.all = this.sessions.all.map((s) =>
      s.id === refreshed.data?.id ? refreshed.data : s,
    );
    this._sessions.active = refreshed.data;
  }

  async refreshRecordings() {
    if (!this.sessions.active) return;

    const refreshed = await actions.recording.getBySessionId(
      this.sessions.active.id,
    );

    if (refreshed.error) {
      messages.error("Unable to refresh session recordings", refreshed.error);
    }

    this.recordings.all = refreshed.data ?? [];
  }

  async refreshActiveRecording() {
    if (!this.recordings.active) return;

    const refreshed = await actions.recording.getById(
      this.recordings.active.id,
    );

    if (refreshed.error) {
      messages.error("Unable to refresh active recroding", refreshed.error);
      this._recordings.active = null;
      return;
    }

    this._recordings.all = this.recordings.all.map((r) =>
      r.id === refreshed.data?.id ? refreshed.data : r,
    );
    this._recordings.active = refreshed.data;
  }

  setActiveRecording(recording: typeof this.recordings.active) {
    if (this.recordings.unsaved) return;

    if (!recording) {
      this._recordings.active = null;
      return;
    }

    this._recordings.active = recording;
  }

  async preloadRecordings(token: string) {
    this._recordings.preloaded = await preloadVideos(
      this.recordings.all,
      token,
    );
  }
}

export default new QuestGlobalStore();
