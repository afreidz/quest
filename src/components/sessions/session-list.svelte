<script lang="ts">
  import ConfirmForm, {
    DEFAULT_CONFIRM_TEXT,
  } from "@/components/app/confirm-form.svelte";

  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import { timezone } from "@/utilities/time";
  import messages from "@/stores/messages.svelte";
  import { Temporal } from "@js-temporal/polyfill";
  import type { Revisions } from "@/actions/revisions";
  import Actions from "@/components/app/actions.svelte";
  import type { Respondents } from "@/actions/respondents";
  import type { NewSessionSchema } from "@/actions/sessions";
  import { preventDefault, sessionToICSInvite } from "@/utilities/events";

  onMount(async () => {
    await store.refreshMe();
    await store.refreshAllSessions();
  });

  // Use "en-ca" so that the date is formatted YYYY-MM-DD
  const dateFormatter = new Intl.DateTimeFormat("en-ca", {
    day: "2-digit",
    year: "numeric",
    month: "2-digit",
  });

  const timeFormatter = new Intl.DateTimeFormat("en-us", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const displayFormatter = new Intl.DateTimeFormat("en-us", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const now = Temporal.Now.instant().epochMilliseconds;

  let loading = $state(false);
  let suggestionText = $state("");
  let showConfirmCancel = $state(false);
  let video: HTMLVideoElement | null = $state(null);
  let showCreateSessionForm: boolean = $state(false);
  let showRescheduleSessionForm: boolean = $state(false);
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
    if (store.me?.email && !newSession.moderator)
      newSession.moderator = store.me.email;
  });

  $effect(() => {
    if (video && store.sessions.activeRecording?.videoURL) {
      actions.tokens.getBlobToken({}).then((resp) => {
        if (resp.error) console.error(resp.error);
        if (video && resp.data)
          video.src = `${store.sessions.activeRecording?.videoURL}?${resp.data.toString()}`;
      });
    }
  });

  $effect(() => {
    if (
      store.sessions.active &&
      !store.sessions.activeRecording &&
      store.sessions.active.recordings[0]
    ) {
      store.setSessionRecording(store.sessions.active.recordings[0]);
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

  async function rescheduleSession() {
    showRescheduleSessionForm = false;

    if (!store.sessions.active?.id) return;

    loading = true;

    const scheduled = Temporal.PlainDateTime.from(
      `${chosenDate}T${chosenTime}:00`,
    )
      .toZonedDateTime(timezone)
      .toInstant()
      .toString();

    const resp = await actions.sessions.updateById({
      id: store.sessions.active.id,
      data: {
        scheduled,
      },
    });

    if (resp.error || !resp.data) {
      return messages.error("Unable to create session", resp.error);
    }

    loading = false;

    const now = Temporal.Now.instant().epochMilliseconds;
    chosenTime = timeFormatter.format(now);
    chosenDate = dateFormatter.format(now);

    if (!resp) return;

    await store.refreshAllSessions();

    const sessionDateTime = new Date(
      Temporal.Instant.from(resp.data.scheduled as any).toZonedDateTimeISO(
        timezone,
      ).epochMilliseconds,
    );

    messages.success(
      `Session rescheduled for ${displayFormatter.format(sessionDateTime)}`,
      JSON.stringify(resp, null, 2),
    );
  }

  async function deleteSession(returnValue?: string) {
    showConfirmCancel = false;

    if (!returnValue || returnValue !== DEFAULT_CONFIRM_TEXT) return;
    if (!store.sessions.active) return;

    loading = true;
    const resp = await actions.sessions
      .deleteById(store.sessions.active.id)
      .catch((err) => {
        messages.error(err.message, err.detail);
      });
    loading = false;
    store.setActiveSession(null);

    if (!resp) return;

    await store.refreshAllSessions();
    messages.success(`Sesion was deleted.`, JSON.stringify(resp, null, 2));
  }

  async function saveToTeams() {
    if (!store.sessions.active) return;
    const event = sessionToICSInvite(store.sessions.active);

    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(
      new Blob([event], { type: "text/calendar" }),
    );
    anchor.download = `quest-session-with-${store.sessions.active.respondent.email}.ics`;
    anchor.click();
  }
</script>

<div
  class="min-w-80 max-w-md w-1/3 bg-neutral flex flex-col border-neutral-200 border-r sticky top-0"
>
  <h2
    class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
  >
    <span>Sessions</span>
    <Actions
      addForm={createSessionForm}
      addTip="Schedule a New Session"
      bind:addShown={showCreateSessionForm}
      class="max-w-[95vw] min-w-[800px] w-full max-h-[95vh] min-h-[800px] h-full flex flex-col"
    />
  </h2>
  <div
    class:skeleton={loading}
    class="bg-neutral rounded-none flex-1 overflow-auto"
  >
    {#if !loading}
      {#each store.sessions.all as session}
        {@const scheduled = Temporal.Instant.from(
          session.scheduled.toString(),
        ).toZonedDateTimeISO(timezone)}
        <button
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
                    <iconify-icon class="text-xs" icon="mdi:calendar"
                    ></iconify-icon>
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
        </button>
      {/each}
    {/if}
  </div>
</div>

<div class="flex-1 p-4 overflow-auto flex flex-col justify-between">
  <header class="flex w-full justify-between">
    {#if store.sessions.active && !store.sessions.active.completed}
      <div class="join">
        {#if store.sessions.active}
          <a
            target="_blank"
            class="btn btn-ghost join-item"
            href={`/sessions/participate/${store.sessions.active.id}`}
            >Open Participant Page</a
          >
          <a
            target="_blank"
            class="btn btn-ghost join-item"
            href={`/sessions/host/${store.sessions.active.id}`}
            >Open Host Page</a
          >
        {/if}
      </div>
      <Actions
        size="md"
        onAdd={saveToTeams}
        editIcon="mdi:reschedule"
        deleteTip="Cancel Session"
        editTip="Reschedule Session"
        addIcon="mdi:microsoft-teams"
        addTip="Save to Teams calendar"
        editForm={rescheduleSessionForm}
        deleteForm={cancelOrDeleteSession}
        bind:deleteShown={showConfirmCancel}
        bind:editShown={showRescheduleSessionForm}
      />
    {:else if store.sessions.active && store.sessions.active.completed}
      <div class="flex-1"></div>
      <Actions
        size="md"
        deleteTip="Cancel Session"
        deleteForm={cancelOrDeleteSession}
        bind:deleteShown={showConfirmCancel}
      />
    {/if}
  </header>
  <div class="flex-1 w-full flex items-center justify-center">
    {#if store.sessions.activeRecording}
      <!-- svelte-ignore a11y_media_has_caption -->
      <video
        controls
        bind:this={video}
        class="w-full max-w-[1280px] aspect-video"
        class:hidden={!store.sessions.activeRecording.videoURL}
      ></video>
    {/if}
  </div>
</div>

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
                class="btn bg-neutral btn-primary btn-lg btn-outline rounded-none w-full text-left border-neutral-200 border-r-0 border-l-0 [&:not(:first-child)]:border-t-0 flex"
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
          <section class="flex flex-col gap-2 flex-1 p-1">
            <label class="form-control flex-none">
              <div class="label">
                <span class="label-text">Moderator</span>
                <span class="label-text-alt italic">Required</span>
              </div>
              <input
                type="email"
                bind:value={newSession.moderator}
                class="input input-bordered bg-neutral w-full"
              />
            </label>
          </section>
        </div>
        <div class="flex flex-col flex-1 gap-8">
          <div class="form-control w-full">
            <label class="label cursor-pointer">
              <span class="label-text">Send invite to respondent email</span>
              <input
                type="checkbox"
                bind:checked={newSession.invite}
                class="toggle toggle-primary [--tglbg:#ffffff]"
              />
            </label>
          </div>
        </div>
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

{#snippet rescheduleSessionForm()}
  <form
    onsubmit={preventDefault(rescheduleSession)}
    class="flex-1 bg-base-100/10 border rounded-box flex flex-col font-normal overflow-clip"
  >
    <section class="flex gap-8 w-full flex-none p-4">
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
    <footer class="flex justify-end gap-4 p-4">
      <button
        class="btn btn-ghost"
        onclick={preventDefault(() => (showCreateSessionForm = false))}
      >
        Cancel
      </button>
      <button type="submit" class="btn btn-primary">Reschedule Session</button>
    </footer>
  </form>
{/snippet}

{#snippet cancelOrDeleteSession()}
  <ConfirmForm onsubmit={deleteSession}>
    Are you sure you want to {store.sessions.active?.completed
      ? "delete"
      : "cancel"} this session?
    {#if store.sessions.active?.completed}You will lose all systems and scores
      associated with it. This is not reversible!{/if}
  </ConfirmForm>
{/snippet}

<style lang="postcss">
  .highlight {
    @apply bg-secondary/30 border-l-4 border-l-secondary;
  }
</style>
