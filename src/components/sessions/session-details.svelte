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

  $effect(() => console.log(store.sessions.active));
</script>

{#if store.sessions.active && token}
  {@const session = store.sessions.active}
  <div class="drawer drawer-end xl:drawer-open">
    <input id="session-details" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content p-4">
      <header class="flex justify-end mb-4">
        {#if store.sessions.active && !store.sessions.active.completed}
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
          <Actions
            size="md"
            deleteTip="Delete Session"
            deleteForm={cancelOrDeleteSession}
            bind:deleteShown={showConfirmCancel}
          />
        {/if}
      </header>
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
      <label
        for="session-details"
        class="btn btn-primary drawer-button xl:hidden"
      >
        Show details
      </label>
    </div>
    <div class="drawer-side border-l h-full min-w-[500px] max-w-[33vw] w-full">
      <label
        for="session-details"
        class="drawer-overlay"
        aria-label="close sidebar"
      ></label>
      <div class="collapse collapse-arrow rounded-none">
        <input type="checkbox" checked />
        <CardHeader icon="tabler:live-photo" class="bg-neutral collapse-title">
          <span>
            Session with {session.respondent.name || session.respondent.email}
          </span>
        </CardHeader>
        <div class="collapse-content">
          <div class="flex items-center gap-2 px-2 pt-4">
            <span class="badge badge-primary"
              >{session.revision.system.client.name}</span
            >
            <span class="badge badge-secondary"
              >{session.revision.system.title}</span
            >
          </div>
          <ul>
            <li></li>
          </ul>
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
        <div class="collapse collapse-arrow rounded-none">
          <input type="checkbox" checked />
          <CardHeader
            icon="mdi:video-outline"
            class="bg-neutral border-t collapse-title"
          >
            <span> Session Videos </span>
          </CardHeader>
          <div class="collapse-content">
            <div class="flex-none overflow-auto m-3 border rounded-box">
              {#await getRecordingSchedule(session.started || session.scheduled, session.recordings, token) then schedule}
                {#each schedule as result, i}
                  <button
                    onclick={preventDefault(() =>
                      store.setSessionRecording(result.recording),
                    )}
                    class:highlight={store.sessions.activeRecording?.id ===
                      result.recording.id}
                    class="btn btn-primary btn-lg btn-outline bg-neutral rounded-none w-full text-left border-neutral-200 border-t-0 border-r-0 border-l-0 last:border-b-0 flex"
                  >
                    <iconify-icon icon="mdi:video-outline"></iconify-icon>
                    <span class="flex-1">Recording {i + 1}</span>
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
          </div>
        </div>
        <div class="collapse rounded-none collapse-arrow">
          <input type="checkbox" checked />
          <CardHeader
            class="flex-none border-t bg-neutral collapse-title"
            icon="mdi:speak-outline">Transcription</CardHeader
          >
          <div class="collapse-content">
            <ul class="flex-1 overflow-auto flex flex-col justify-start p-2">
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
          </div>
        </div>
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
{/if}

{#snippet sessionActions()}{/snippet}

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
    @apply bg-secondary/30;
  }
</style>
