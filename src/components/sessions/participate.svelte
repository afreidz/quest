<script lang="ts">
  import { Temporal } from "@js-temporal/polyfill";
  import sessionStore from "@/stores/session.svelte";
  import type { DataMessage } from "@/utilities/data";
  import type { SessionById } from "@/actions/sessions";
  import Actions from "@/components/sessions/actions.svelte";

  type Props = {
    session: SessionById;
  };

  sessionStore.messenger?.on("message", (e: DataMessage) => {
    if (e.type === "push-url") url = e.url;
    if (e.type === "recording-stop") recording = false;
    if (e.type === "session-stop") sessionStore.disconnect();
    if (e.type === "recording-start")
      recording = Temporal.Now.zonedDateTimeISO();
  });

  let { session }: Props = $props();
  let url: string | null = $state(null);
  let recording: Temporal.ZonedDateTime | false = $state(false);
  let interval: ReturnType<typeof setInterval> | null = $state(null);
  let now: Temporal.ZonedDateTime = $state(Temporal.Now.zonedDateTimeISO());

  let ellapsed = $derived(
    recording ? now.since(recording) : Temporal.Duration.from({ seconds: 0 }),
  );

  $effect(() => {
    if (recording && !interval) interval = setInterval(updateRecording, 1000);
    if (!recording && interval) clearInterval(interval);
  });

  function updateRecording() {
    now = Temporal.Now.zonedDateTimeISO();
  }

  function formatDurationToHHMMSS(duration: Temporal.Duration) {
    const hours = String(duration.hours).padStart(2, "0");
    const minutes = String(duration.minutes).padStart(2, "0");
    const seconds = String(duration.seconds).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }
</script>

<div class="flex-1 size-full flex flex-col items-center justify-center gap-4">
  <header class="w-full flex justify-end">
    {#each sessionStore.participants as participant}
      <div class="badge glass flex items-center gap-2">
        <iconify-icon
          class:text-error={participant.muted}
          class:text-success={participant.speaking}
          class:text-neutral-950={!participant.muted}
          icon="mdi:microphone{participant.muted ? '-off' : ''}"
        ></iconify-icon>
        <span>{participant.name}</span>
      </div>
    {/each}
  </header>
  <div class="flex-1 w-full text-center p-4">
    <div
      class="mt-12 mx-auto mockup-browser bg-base-300/10 border shadow-sm max-h-[80vh] aspect-video"
    >
      <div class="mockup-browser-toolbar pointer-events-none">
        <div class="input !bg-neutral !w-full max-w-[50vw] select-none">
          <span class="font-semibold"
            >{session.revision.system.client.name}</span
          >
          <span class="text-neutral-content/10 inline-block mx-2">|</span>
          {session.revision.system.title}
          <span class="text-neutral-content/10 inline-block mx-2">|</span>
          {session.revision.title}
        </div>
        <div class="badge flex gap-1 glass">
          <i class="rounded-full h-2 w-2 bg-error"></i>
          {formatDurationToHHMMSS(ellapsed)}
        </div>
      </div>
      <div class="bg-neutral flex justify-center items-center size-full">
        {#if url}
          <iframe
            src={url}
            frameborder="0"
            class:hidden={!url}
            class="flex-1 size-full"
            title="Host's shared content"
          ></iframe>
        {:else}
          <span class="uppercase font-semibold text-base-200"
            >Waiting for host to push</span
          >
        {/if}
      </div>
    </div>
  </div>
  <Actions class="p-3" />
</div>
