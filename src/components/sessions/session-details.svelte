<script lang="ts">
  import {
    dateFormatter,
    timeFormatter,
    displayFormatter,
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
  import { preventDefault, sessionToICSInvite } from "@/utilities/events";

  type Props = {
    video?: HTMLVideoElement | null;
  };

  const now = Temporal.Now.instant().epochMilliseconds;

  let loading = $state(false);
  let showConfirmCancel = $state(false);
  let token: string | null = $state(null);
  let { video = $bindable() }: Props = $props();
  let showCreateSessionForm: boolean = $state(false);
  let showRescheduleSessionForm: boolean = $state(false);
  let chosenTime: string = $state(timeFormatter.format(now));
  let chosenDate: string = $state(dateFormatter.format(now));

  onMount(async () => {
    token = (await actions.tokens.getBlobToken({})).data ?? null;
  });

  $effect(() => {
    if (
      store.sessions.active &&
      store.recordings.all[0] &&
      !store.recordings.active
    ) {
      store.setActiveRecording(store.recordings.all[0]);
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

{#if store.sessions.active}
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
  {#if store.sessions.active && store.recordings.active && token}
    {#await store.preloadRecordings(token)}
      preloading videos...
    {:then _}
      <div
        class="aspect-video shadow-2xl max-w-[1280px] border border-success bg-black rounded-box flex items-center justify-center overflow-clip"
      >
        <!-- svelte-ignore a11y_media_has_caption -->
        <video
          controls
          src={store.recordings.preloaded[store.recordings.active.id]}
          bind:this={video}
          class="size-full"
        ></video>
      </div>
    {/await}
  {/if}
{/if}

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
