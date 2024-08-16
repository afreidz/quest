<script lang="ts">
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import session from "@/stores/session.svelte";
  import Pane from "@/components/app/pane.svelte";
  import messages from "@/stores/messages.svelte";
  import { Temporal } from "@js-temporal/polyfill";
  import { preventDefault } from "@/utilities/events";
  import type { SessionById } from "@/actions/sessions";
  import Actions from "@/components/sessions/actions.svelte";
  import { LocalVideoStream } from "@azure/communication-calling";
  import HostTools from "@/components/sessions/host-tools.svelte";
  import { timezone, formatDurationToHHMMSS } from "@/utilities/time";
  import Participant from "@/components/sessions/participant-view.svelte";

  type Props = {
    session: SessionById;
  };

  let urlToPush: string = $state("");
  let screen: HTMLElement | null = $state(null);
  let { session: sessionRecord }: Props = $props();
  let interval: ReturnType<typeof setInterval> | null = $state(null);
  let now: Temporal.ZonedDateTime = $state(Temporal.Now.zonedDateTimeISO());
  let recording = $derived(
    session.recordingSince
      ? Temporal.Instant.from(
          session.recordingSince.toISOString(),
        ).toZonedDateTimeISO(timezone)
      : null,
  );

  let ellapsed = $derived(
    recording ? now.since(recording) : Temporal.Duration.from({ seconds: 0 }),
  );

  let feed = $derived(
    session.camEnabled && session.camera
      ? new LocalVideoStream(session.camera)
      : undefined,
  );

  $effect(() => {
    if (recording && !interval) interval = setInterval(updateRecording, 1000);
    if (!recording && interval) clearInterval(interval);
  });

  $effect(() => {
    if (session.screen && screen) {
      session
        .renderVideoStream(screen, session.screen, { scalingMode: "Fit" })
        .then((v) => (session.screenView = v));
    }
  });

  function updateRecording() {
    now = Temporal.Now.zonedDateTimeISO();
  }

  function pushURL(url: string | null) {
    if (!url) return;
    if (URL.canParse(url)) {
      session.messenger?.send({ type: "push-url", url });
    }
  }

  async function addKeyMoment() {
    if (!session.id) return;

    const resp = await actions.sessions.addMoment({
      session: session.id,
      time: formatDurationToHHMMSS(ellapsed),
    });

    if (resp.error) {
      messages.error("Unable to save key moment", resp.error);
    }

    sessionRecord =
      (await actions.sessions.getById(session.id)).data ?? sessionRecord;
  }
</script>

<div class="flex gap-4 h-full max-h-screen">
  <div
    class="flex-1 max-h-full flex flex-col items-center justify-center mt-12"
  >
    <header class="flex w-full justify-end items-center gap-4">
      {#each session.participants as participant}
        <Participant
          online
          class="w-48"
          id={participant.id}
          name={participant.name}
          feed={participant.camera}
          muted={participant.muted}
          bootable={session.role === "host"}
        />
      {/each}
      {#if session.userId}
        <Participant
          {feed}
          online
          class="w-48"
          bootable={false}
          id={session.userId}
          name={session.name}
          muted={session.muted}
        />
      {/if}
    </header>
    <section
      class="w-full flex-1 flex flex-col items-center justify-center my-4 relative"
    >
      <header class="mb-2 flex justify-between items-end w-full max-w-[1280px]">
        <div class="badge flex gap-1 glass">
          <i class="rounded-full h-2 w-2 bg-error"></i>
          {formatDurationToHHMMSS(ellapsed)}
        </div>
        <button
          onclick={addKeyMoment}
          data-tip="Create a key moment"
          class="btn btn-outline btn-sm tooltip tooltip-primary tooltip-left"
        >
          <iconify-icon icon="mdi:lightbulb-on-outline"></iconify-icon>
        </button>
      </header>
      <span
        class:hidden={session.screen}
        class="text-neutral w-full text-center uppercase font-semibold absolute left-0 right-0 z-[1]"
        >Waiting for participant to share screen</span
      >
      <div
        bind:this={screen}
        class="w-full max-w-[1280px] min-w-[320px] aspect-video shadow-md border border-success bg-black rounded-box flex items-center justify-center"
      ></div>
      <div
        class="py-4 w-full max-w-[1280px] min-w-[320px] relative z-[2] flex items-center gap-3"
      >
        {#if sessionRecord.revision.survey}
          {@const surveyURL = new URL(
            `/surveys/take/${sessionRecord.revision.survey.id}/${sessionRecord.respondentId}?hideMode=true`,
            window.location.origin,
          )}
          <button
            disabled={!session.screen}
            onclick={() => pushURL(surveyURL.href)}
            class="btn btn-outline">Push SUS Survey to Participant</button
          >
        {/if}
        {#if sessionRecord.prototypeURL}
          <button
            disabled={!session.screen}
            onclick={() => pushURL(sessionRecord.prototypeURL)}
            class="btn btn-outline">Push Prototype to Participant</button
          >
        {/if}
        <form
          onsubmit={preventDefault(() => {
            pushURL(urlToPush);
            urlToPush = "";
          })}
          class="join border w-full flex overflow-clip"
        >
          <label
            for="push"
            class:opacity-30={!session.screen}
            class:bg-neutral={!!session.screen}
            class="text-sm px-4 flex items-center"
            >Push URL To Participant</label
          >
          <input
            required
            id="push"
            type="url"
            name="push"
            bind:value={urlToPush}
            disabled={!session.screen}
            class="join-item flex-1 px-2"
          />
          <button
            type="submit"
            disabled={!session.screen}
            class="join-item btn btn-primary">Push</button
          >
        </form>
      </div>
    </section>
    <Actions class="p-3" />
  </div>
  <Pane
    size="lg"
    collapsable
    location="right"
    class="flex flex-col"
    title="Session Checklist"
  >
    <HostTools session={sessionRecord} />
  </Pane>
</div>
