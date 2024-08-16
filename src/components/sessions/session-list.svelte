<script lang="ts">
  import {
    timezone,
    timeFormatter,
    dateFormatter,
    displayFormatter,
  } from "@/utilities/time";

  import type {
    SessionQuery,
    SessionFromAll,
    NewSessionSchema,
  } from "@/actions/sessions";

  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import messages from "@/stores/messages.svelte";
  import Pane from "@/components/app/pane.svelte";
  import { Temporal } from "@js-temporal/polyfill";
  import { extractIframeSrc } from "@/utilities/dom";
  import { preventDefault } from "@/utilities/events";
  import type { Revisions } from "@/actions/revisions";
  import Actions from "@/components/app/actions.svelte";
  import type { Respondents } from "@/actions/respondents";
  import FilterSessions from "@/components/sessions/filter.svelte";

  onMount(async () => {
    await store.refreshMe();
    await store.refreshAllSessions();
    loading = false;
  });

  const now = Temporal.Now.instant().epochMilliseconds;

  let loading = $state(true);
  let suggestionText = $state("");
  let embedCodeValid = $state(false);
  let showFiltersForm = $state(false);
  let filters: SessionQuery = $state({});
  let protoURL: string | null = $state(null);
  let sessions = $derived(store.sessions.all);
  let embedCode: string | null = $state(null);
  let showCreateSessionForm: boolean = $state(false);
  let chosenTime: string = $state(timeFormatter.format(now));
  let chosenDate: string = $state(dateFormatter.format(now));

  let newSession: Omit<NewSessionSchema, "scheduled"> = $state({
    revision: "",
    moderator: "",
    invite: false,
    respondent: "",
  });

  let respondents = $derived.by(async () => {
    if (!showCreateSessionForm)
      return { data: [] as Respondents, error: undefined };
    loading = true;
    return suggestionText
      ? actions.respondents.getBySearch(suggestionText).then((r) => {
          loading = false;
          return r;
        })
      : actions.respondents.getAll({}).then((r) => {
          loading = false;
          return r;
        });
  });

  let revisions = $derived.by(async () => {
    if (!showCreateSessionForm || !newSession.respondent)
      return { data: [] as Revisions, error: undefined };
    loading = true;
    return actions.revision
      .getByRespondentId(newSession.respondent)
      .then((r) => {
        loading = false;
        return r;
      });
  });

  $effect(() => {
    if (newSession.respondent) {
      newSession.revision = "";
    }
  });

  $effect(() => {
    if (window.location.hash) {
      const session = store.sessions.all.find(
        (c) => c.id === window.location.hash.replace("#", ""),
      );
      if (session) store.setActiveSession(session);
    } else {
      store.setActiveClient(null);
    }
  });

  $effect(() => {
    if (store.sessions.active) {
      window.history.pushState({}, "", `#${store.sessions.active.id}`);
      loading = true;
      store
        .refreshRecordings()
        .then(() => {
          if (!store.recordings.active && store.recordings.all[0])
            store.setActiveRecording(store.recordings.all[0]);
        })
        .finally(() => (loading = false));
    }
  });

  $effect(() => {
    if (store.me?.email && !newSession.moderator)
      newSession.moderator = store.me.email;
  });

  $effect(() => {
    if (embedCode?.trim()) protoURL = null;
  });

  $effect(() => {
    if (protoURL?.trim()) {
      embedCode = null;
      embedCodeValid = false;
    }
  });

  $effect(() => {
    if (embedCode?.trim()) {
      newSession.prototype = extractIframeSrc(embedCode) ?? undefined;
      if (newSession.prototype) embedCodeValid = true;
    }
  });

  async function scheduleSession() {
    showCreateSessionForm = false;

    loading = true;

    const scheduled = Temporal.PlainDateTime.from(
      `${chosenDate}T${chosenTime}:00`,
    )
      .toZonedDateTime(timezone)
      .toInstant()
      .toString();

    const resp = await actions.sessions.create({
      ...newSession,
      scheduled,
    });

    if (resp.error || !resp.data) {
      return messages.error("Unable to create session", resp.error);
    }

    loading = false;
    newSession = {
      revision: "",
      invite: false,
      respondent: "",
      moderator: store.me?.email ?? "",
    };

    const now = Temporal.Now.instant().epochMilliseconds;
    chosenTime = timeFormatter.format(now);
    chosenDate = dateFormatter.format(now);

    await store.refreshAllSessions();

    const sessionDateTime = new Date(
      Temporal.Instant.from(resp.data.scheduled as any).toZonedDateTimeISO(
        timezone,
      ).epochMilliseconds,
    );

    messages.success(
      `Session scheduled for ${displayFormatter.format(sessionDateTime)} with ${resp.data.respondent.name || resp.data.respondent.email}`,
      JSON.stringify(resp, null, 2),
    );
  }

  async function filterSessions() {
    showFiltersForm = false;

    loading = true;
    await store.refreshAllSessions(filters);
    loading = false;
  }

  const howToGetFigmaEmbedCode = `1. Open the Figma file that you want to push to the participant.

2. Click Share in the toolbar, and then Get embed code.

3. To copy the embed code, click Copy.

4. Paste the embed code into the textarea here.`;
</script>

<Pane
  collapsable
  title="Sessions"
  items={sessions}
  render={rednerSession}
  prelist={appliedFilters}
  emptyContent={noSessions}
  actions={allSessionsActions}
/>

{#snippet noSessions()}
  <strong
    class="flex items-center justify-center uppercase font-semibold opacity-50 my-6"
    >No sessions found with search criteria</strong
  >
{/snippet}

{#snippet appliedFilters()}
  {@const appliedCount = Object.values(filters).reduce((count, value) => {
    if (value === true) count += 1;
    if (value instanceof Array) count += value.length;
    return count;
  }, 0)}

  {#if appliedCount > 0}
    <div class="p-3 border-b flex justify-between">
      <button onclick={() => (showFiltersForm = true)} class="badge glass"
        >{appliedCount} filters applied</button
      >
      <button
        onclick={() => {
          filters = {};
          filterSessions();
        }}
        class="btn btn-xs btn-outline">clear</button
      >
    </div>
  {/if}
{/snippet}

{#snippet allSessionsActions()}
  <Actions
    editTip="Filter sessions"
    addForm={createSessionForm}
    editIcon="mdi:filter-outline"
    editForm={filterSessionsForm}
    addTip="Schedule a New Session"
    bind:editShown={showFiltersForm}
    bind:addShown={showCreateSessionForm}
    class={showCreateSessionForm
      ? "max-w-[95vw] min-w-[800px] w-full max-h-[95vh] min-h-[800px] h-full flex flex-col"
      : showFiltersForm
        ? "min-h-[800px] max-h-[95vh] w-full h-full max-w-[95vw] flex flex-col"
        : ""}
  />
{/snippet}

{#snippet rednerSession(session: SessionFromAll)}
  {@const scheduled = Temporal.Instant.from(
    session.started ? session.started.toString() : session.scheduled.toString(),
  ).toZonedDateTimeISO(timezone)}
  <a
    href={`#${session.id}`}
    class:tooltip={store.sessions.unsaved}
    class:highlight={store.sessions.active?.id === session.id}
    data-tip={"You have unsaved changes to the current session!"}
    onclick={preventDefault(() => store.setActiveSession(session))}
    class="btn btn-primary btn-lg btn-outline rounded-none w-full tooltip-error tooltip-top first:tooltip-bottom tooltip-b text-left border-neutral-200 border-t-0 border-r-0 border-l-0 !h-auto px-4 py-4"
  >
    <div class="flex flex-1 items-center justify-start gap-4">
      <div class="flex-none flex justify-center">
        <iconify-icon class="text-neutral-400" icon="tabler:live-photo"
        ></iconify-icon>
      </div>
      <div class="flex flex-col gap-2 flex-1">
        <div class="flex justify-between w-full">
          <div class="flex items-center gap-2">
            <span class="badge badge-primary"
              >{session.revision.system.client.name}</span
            >
            <span class="badge badge-secondary"
              >{session.revision.system.title}</span
            >
          </div>
          {#if !session.completed}
            <span
              class="badge glass self-end tooltip tooltip-left"
              data-tip="Upcoming Session"
            >
              <iconify-icon class="text-xs" icon="mdi:calendar"></iconify-icon>
            </span>
          {:else}
            <span
              data-tip="Completed Session"
              class="badge badge-success self-end tooltip tooltip-left"
            >
              <iconify-icon class="text-xs" icon="mdi:check-bold"
              ></iconify-icon>
            </span>
          {/if}
        </div>
        <strong class="font-semibold"
          >Session with {session.respondent.name ??
            session.respondent.email}</strong
        >
        <small class="text-xs text-neutral-400"
          >{displayFormatter.format(
            new Date(scheduled.epochMilliseconds),
          )}</small
        >
      </div>
    </div>
  </a>
{/snippet}

{#snippet createSessionForm()}
  <form
    onsubmit={preventDefault(scheduleSession)}
    class="flex-1 bg-base-100/10 border rounded-box flex font-normal overflow-clip"
  >
    <div
      class:skeleton={loading}
      class="min-w-80 w-1/3 max-w-sm bg-neutral rounded-none flex-1 border-r h-full overflow-auto flex flex-col"
    >
      <h2
        class="p-3 flex-none border-neutral-200 border-b text-base font-bold flex justify-between items-center"
      >
        <span>Select Respondent</span>
      </h2>
      <div class="p-3 flex-none border-neutral-200 border-b">
        <label
          class="input input-bordered input-sm bg-base-100/10 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Search"
            class="grow skip-focus"
            bind:value={suggestionText}
          />
          <iconify-icon class="text-xl" icon="material-symbols:search"
          ></iconify-icon>
        </label>
      </div>
      <div class="flex-1 overflow-auto">
        {#await respondents then respondents}
          {#if respondents.data}
            {#each respondents.data as respondent}
              <button
                type="button"
                onclick={() => (newSession.respondent = respondent.id)}
                class:highlight={newSession.respondent === respondent.id}
                class="skip-focus btn btn-primary btn-lg btn-outline rounded-none w-full text-left border-neutral-200 border-t-0 border-r-0 border-l-0 flex"
              >
                <span class="flex-1">{respondent.name ?? respondent.email}</span
                >
              </button>
            {/each}
          {/if}
        {/await}
      </div>
    </div>
    <div
      class="min-w-80 w-1/3 max-w-sm bg-neutral flex flex-col border-neutral-200 border-r"
    >
      <h2
        class="p-3 flex-none border-neutral-200 border-b text-base font-bold flex justify-between items-center"
      >
        <span>Select a Revision</span>
      </h2>
      <div
        class:skeleton={loading}
        class="bg-base-100/20 rounded-none flex-1 overflow-auto flex flex-col justify-center"
      >
        {#await revisions then revisions}
          {#if revisions.data}
            {#each revisions.data as revision}
              <button
                type="button"
                onclick={() => (newSession.revision = revision.id)}
                class:highlight={newSession.revision === revision.id}
                disabled={revision.sessions.some(
                  (s) => s.respondentId === newSession.respondent,
                )}
                class:tooltip={revision.sessions.some(
                  (s) => s.respondentId === newSession.respondent,
                )}
                data-tip="This respondent already has a scheduled or completed session for this revision"
                class="btn bg-neutral btn-primary btn-lg btn-outline rounded-none w-full text-left border-neutral-200 border-r-0 border-l-0 [&:not(:first-child)]:border-t-0 flex tooltip-top tooltip-primary disabled:!pointer-events-auto disabled:hover:!border-none"
              >
                <span class="flex-1">{revision.title}</span>
                <div class="badge badge-secondary">
                  {revision.system.title}
                </div>
              </button>
            {/each}
          {/if}
        {/await}
      </div>
    </div>
    {#if newSession.respondent && newSession.revision}
      <div class="p-3 px-4 flex flex-col flex-1 gap-3">
        <header class="text-base font-semibold flex justify-between opacity-50">
          Schedule Session
        </header>
        <section class="flex gap-8 w-full flex-none p-1">
          <label class="form-control flex-1">
            <div class="label">
              <span class="label-text">Date</span>
              <span class="label-text-alt italic">Required</span>
            </div>
            <input
              required
              type="date"
              bind:value={chosenDate}
              class="input input-bordered bg-neutral w-full accent-primary"
            />
          </label>
          <label class="form-control flex-1">
            <div class="label">
              <span class="label-text">Time</span>
              <span class="label-text-alt italic">Required</span>
            </div>
            <input
              required
              type="time"
              bind:value={chosenTime}
              class="input input-bordered bg-neutral w-full accent-primary"
            />
          </label>
        </section>
        <div class="flex flex-none gap-8">
          <section class="flex flex-col gap-2 flex-[0.4] p-1">
            <label class="form-control flex-none">
              <div class="label">
                <span class="label-text">Moderator</span>
                <span class="label-text-alt italic">Required</span>
              </div>
              <input
                required
                type="email"
                bind:value={newSession.moderator}
                class="input input-bordered bg-neutral w-full"
              />
            </label>
            <label class="label cursor-pointer">
              <span class="label-text">Send invite to respondent email</span>
              <input
                type="checkbox"
                bind:checked={newSession.invite}
                class="toggle toggle-primary [--tglbg:#ffffff]"
              />
            </label>
          </section>
          <section class="flex flex-col gap-2 flex-[0.6] p-1">
            <label class="form-control flex-none">
              <div class="label">
                <span class="label-text">Prototype Embed Code</span>
                {#if !embedCode?.trim()}
                  <span
                    data-tip={howToGetFigmaEmbedCode}
                    class="label-text-alt tooltip tooltip-left before:!whitespace-pre-line before:border before:!text-left before:shadow-sm"
                  >
                    <iconify-icon class="text-xl" icon="mdi:information-outline"
                    ></iconify-icon>
                  </span>
                {:else if !embedCodeValid}
                  <iconify-icon
                    class="text-xl text-error"
                    icon="mdi:close-circle"
                  ></iconify-icon>
                {:else}
                  <span
                    data-tip={howToGetFigmaEmbedCode}
                    class="label-text-alt tooltip tooltip-left before:!whitespace-pre-line before:border before:!text-left before:shadow-sm"
                  >
                    <iconify-icon
                      class="text-xl text-success"
                      icon="mdi:check-circle"
                    ></iconify-icon>
                  </span>
                {/if}
              </div>
              <textarea
                bind:value={embedCode}
                class="textarea textarea-bordered bg-neutral w-full"
              ></textarea>
            </label>
            <span class="w-full text-center text-xs">-or-</span>
            <label class="form-control flex-none">
              <div class="label">
                <span class="label-text">Prototype URL</span>
              </div>
              <input
                type="url"
                bind:value={protoURL}
                class="input input-bordered bg-neutral w-full disabled:bg-base-100/10"
              />
            </label>
          </section>
        </div>
        <div class="flex flex-col flex-1 gap-8"></div>
        <footer class="flex-none flex justify-end gap-4 p-1">
          <button
            class="btn btn-ghost"
            onclick={preventDefault(() => (showCreateSessionForm = false))}
          >
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">Schedule Session</button
          >
        </footer>
      </div>
    {/if}
  </form>
{/snippet}

{#snippet filterSessionsForm()}
  {#if showFiltersForm}
    <FilterSessions bind:filters onsubmit={filterSessions} />
  {/if}
{/snippet}
