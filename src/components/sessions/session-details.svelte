<script lang="ts">
  import {
    dateFormatter,
    timeFormatter,
    displayFormatter,
    displayTimeFormatter,
  } from "@/utilities/time";

  import ConfirmForm, {
    DEFAULT_CONFIRM_TEXT,
  } from "@/components/app/confirm-form.svelte";

  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import { timezone } from "@/utilities/time";
  import messages from "@/stores/messages.svelte";
  import { Temporal } from "@js-temporal/polyfill";
  import Actions from "@/components/app/actions.svelte";
  import { getRecordingSchedule } from "@/utilities/video";
  import Avatar from "@/components/respondents/avatar.svelte";
  import CardHeader from "@/components/app/card-header.svelte";
  import ChecklistRadar from "../surveys/checklist-radar.svelte";
  import { preventDefault, sessionToICSInvite } from "@/utilities/events";

  const now = Temporal.Now.instant().epochMilliseconds;

  let loading = $state(false);
  let showConfirmCancel = $state(false);
  let token: string | null = $state(null);
  let video: HTMLVideoElement | null = $state(null);
  let showCreateSessionForm: boolean = $state(false);
  let showRescheduleSessionForm: boolean = $state(false);
  let chosenTime: string = $state(timeFormatter.format(now));
  let chosenDate: string = $state(dateFormatter.format(now));

  onMount(async () => {
    token = (await actions.tokens.getBlobToken({})).data ?? null;
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

{#if store.sessions.active && token}
  {@const session = store.sessions.active}
  <div class="drawer drawer-end xl:drawer-open">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col items-center justify-start p-4">
      {#if store.sessions.activeRecording}
        <div
          class="aspect-video shadow-2xl w-full max-w-[1280px] border border-success bg-black rounded-box flex items-center justify-center overflow-clip"
        >
          <!-- svelte-ignore a11y_media_has_caption -->
          <video
            controls
            bind:this={video}
            class="size-full"
            class:hidden={!store.sessions.activeRecording.videoURL}
          ></video>
        </div>
      {/if}
      <label for="my-drawer-2" class="btn btn-primary drawer-button xl:hidden">
        Show details
      </label>
    </div>
    <div class="drawer-side">
      <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"
      ></label>
      <div
        class="menu bg-neutral border-l text-base-content min-h-full min-w-[500px] max-w-[25vw] w-full p-0 relative flex flex-col"
      >
        <CardHeader
          icon="tabler:live-photo"
          pull={sessionActions}
          class="sticky top-0 left-0 right-0 flex-none"
        >
          <span>
            Session with {session.respondent.name || session.respondent.email}
          </span>
        </CardHeader>
        {#if session.completed}
          <ChecklistRadar
            header={false}
            class="flex-none"
            showIfNoResponses={false}
            respondent={session.respondent.id}
          />

          <div class="flex-none overflow-auto">
            {#await getRecordingSchedule(session.started || session.scheduled, session.recordings, token) then schedule}
              {#each schedule as result, i}
                <button
                  onclick={preventDefault(() =>
                    store.setSessionRecording(result.recording),
                  )}
                  class:highlight={store.sessions.activeRecording?.id ===
                    result.recording.id}
                  class="btn btn-primary btn-lg btn-outline rounded-none w-full text-left border-neutral-200 border-t-0 border-r-0 border-l-0 flex"
                >
                  <iconify-icon icon="mdi:video-outline"></iconify-icon>
                  <span class="flex-1">Video {i + 1}</span>
                  <i class="badge badge-secondary"
                    >{displayTimeFormatter.format(
                      new Date(result.schedule.start.epochMilliseconds),
                    )}-{displayTimeFormatter.format(
                      new Date(result.schedule.end.epochMilliseconds),
                    )}</i
                  >
                </button>
              {/each}
            {/await}
          </div>
          <CardHeader class="flex-none" icon="mdi:speak-outline"
            >Transcription</CardHeader
          >
          <ul
            class="flex-1 overflow-auto flex flex-col justify-start p-2 bg-base-100/5"
          >
            {#each session.transcripts as utterance}
              <div
                class:chat-start={utterance.moderator}
                class:chat-end={!utterance.moderator}
                class="chat"
              >
                <Avatar
                  tip={utterance.moderator
                    ? session.moderator
                    : session.respondent.email}
                  class="chat-image {utterance.moderator
                    ? 'tooltip-right'
                    : 'tooltip-left'}"
                  respondent={{
                    email: utterance.moderator
                      ? session.moderator
                      : session.respondent.name || session.respondent.email,
                    imageURL: utterance.moderator
                      ? null
                      : session.respondent.imageURL,
                  }}
                />
                <div
                  class="chat-bubble shadow-sm"
                  class:chat-bubble-secondary={utterance.moderator}
                >
                  {utterance.text}
                </div>
                <div class="chat-footer opacity-50 text-[10px]">
                  {displayTimeFormatter.format(
                    new Date(utterance.time.toString()),
                  )}
                </div>
              </div>
            {/each}
          </ul>
        {:else}
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
  </div>
{/if}

{#snippet sessionActions()}
  {#if store.sessions.active && !store.sessions.active.completed}
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
  {:else if store.sessions.active && store.sessions.active.completed}
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
