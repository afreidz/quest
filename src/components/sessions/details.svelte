<script lang="ts">
  import {
    timezone,
    timeFormatter,
    dateFormatter,
    displayFormatter,
  } from "@/utilities/time";

  import ConfirmForm, {
    DEFAULT_CONFIRM_TEXT,
  } from "@/components/app/confirm-form.svelte";

  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import messages from "@/stores/messages.svelte";
  import Pane from "@/components/app/pane.svelte";
  import { Temporal } from "@js-temporal/polyfill";
  import Actions from "@/components/app/actions.svelte";
  import Videos from "@/components/sessions/videos.svelte";
  import CardHeader from "@/components/app/card-header.svelte";
  import Transcript from "@/components/sessions/transcript.svelte";
  import SessionVideo from "@/components/sessions/session-video.svelte";
  import { preventDefault, sessionToICSInvite } from "@/utilities/events";
  import ChecklistRadar from "@/components/surveys/checklist-radar.svelte";

  const now = Temporal.Now.instant().epochMilliseconds;

  let loading = $state(false);
  let showConfirmCancel = $state(false);
  let showRescheduleSessionForm = $state(false);
  let video: HTMLVideoElement | null = $state(null);
  let showCreateSessionForm: boolean = $state(false);
  let chosenTime: string = $state(timeFormatter.format(now));
  let chosenDate: string = $state(dateFormatter.format(now));

  let datetime = $derived.by(() => {
    if (!store.sessions.active) return "";
    const zdt = Temporal.Instant.from(
      store.sessions.active.started
        ? store.sessions.active.started.toString()
        : store.sessions.active.scheduled.toString(),
    ).toZonedDateTimeISO(timezone);
    return displayFormatter.format(zdt.epochMilliseconds);
  });

  async function rescheduleSession() {
    showRescheduleSessionForm = false;

    if (!store.sessions.active) return;

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

    if (
      !returnValue ||
      returnValue !== DEFAULT_CONFIRM_TEXT ||
      !store.sessions.active
    )
      return;

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

  async function jumpToTime(n: number) {
    if (video) {
      video.currentTime = n;
      video.play();
    }
  }
</script>

{#if store.sessions.active}
  {@const session = store.sessions.active}
  <div class="flex-1 p-4" id="main-content">
    <SessionVideo bind:video />
  </div>

  <Pane
    size="md"
    min={500}
    collapsable
    location="right"
    class="!bg-base-100/20"
    actions={sessionActions}
    title={`Session with ${session.respondent.name || session.respondent.email}`}
  >
    <div class="collapse collapse-arrow rounded-none">
      <input type="checkbox" checked />
      <CardHeader icon="tabler:live-photo" class="bg-neutral collapse-title">
        <span>Details</span>
      </CardHeader>
      <div class="collapse-content">
        <ul class="p-3 flex flex-col gap-1">
          <li class="flex justify-between">
            <strong class="font-semibold">Client:</strong>
            <a
              href={`/clients#${session.revision.system.clientId}`}
              class="badge badge-primary"
              >{session.revision.system.client.name}</a
            >
          </li>
          <li class="flex justify-between">
            <strong class="font-semibold">System:</strong>
            <a
              href={`/clients/${session.revision.system.clientId}/systems/${session.revision.systemId}`}
              class="badge badge-secondary">{session.revision.system.title}</a
            >
          </li>
          <li class="flex justify-between">
            <strong class="font-semibold">System:</strong>
            <a
              href={`/clients/${session.revision.system.clientId}/systems/${session.revision.systemId}#${session.revisionId}`}
              class="badge bg-secondary border-secondary/30 bg-secondary/30"
              >{session.revision.title}</a
            >
          </li>
          <li class="flex justify-between">
            <strong class="font-semibold">Moderator:</strong>
            <span class="badge glass">{session.moderator}</span>
          </li>
          <li class="flex justify-between">
            <strong class="font-semibold">Participant:</strong>
            <span class="badge glass"
              >{session.respondent.name || session.respondent.email}</span
            >
          </li>
          <li class="flex justify-between">
            <strong class="font-semibold"
              >{#if session.completed}Date/Time:{:else}Scheduled for:{/if}</strong
            >
            <span class="text-xs">{datetime}</span>
          </li>
        </ul>
        {#if !session.completed}
          <div class="p-6 text-center">
            <a
              target="_blank"
              href={`/sessions/host/${session.id}`}
              class="btn btn-primary btn-lg">Start Session</a
            >
          </div>
        {/if}
      </div>
    </div>
    {#if session.completed}
      <ChecklistRadar
        collapseable
        showDetails={true}
        toggleDetails={true}
        headerClass="bg-neutral"
        showIfNoResponses={false}
        respondent={session.respondent.id}
        class="flex-none border-b bg-neutral"
        checklist={session.revision.checklist}
      />
      {#if session.recordings.length}
        <Videos {session} onclick={(r) => store.setActiveRecording(r)} />
      {/if}
      {#if session.transcripts.length}
        <Transcript {session} onclick={(t) => jumpToTime(t)} />
      {/if}
    {/if}
  </Pane>
{/if}

{#snippet sessionActions()}
  {@const session = store.sessions.active}
  {#if session && !session.completed}
    <Actions
      size="sm"
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
  {:else if session}
    <Actions
      size="sm"
      deleteTip="Delete Session"
      deleteForm={cancelOrDeleteSession}
      bind:deleteShown={showConfirmCancel}
    />
  {/if}
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
  {@const session = store.sessions.active}
  <ConfirmForm onsubmit={deleteSession}>
    Are you sure you want to {session?.completed ? "delete" : "cancel"} this session?
    {#if session?.completed}You will lose all systems and scores associated with
      it. This is not reversible!{/if}
  </ConfirmForm>
{/snippet}
