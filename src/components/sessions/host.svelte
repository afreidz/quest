<script lang="ts">
  import session from "@/stores/session.svelte";
  import Pane from "@/components/app/pane.svelte";
  import type { SessionById } from "@/actions/sessions";
  import Actions from "@/components/sessions/actions.svelte";
  import { LocalVideoStream } from "@azure/communication-calling";
  import HostTools from "@/components/sessions/host-tools.svelte";
  import Participant from "@/components/sessions/participant-view.svelte";
  import { preventDefault } from "@/utilities/events";

  type Props = {
    session: SessionById;
  };

  let urlToPush: string = $state("");
  let screen: HTMLElement | null = $state(null);
  let { session: sessionRecord }: Props = $props();

  let feed = $derived(
    session.camEnabled && session.camera
      ? new LocalVideoStream(session.camera)
      : undefined,
  );

  $effect(() => {
    if (session.screen && screen) {
      session
        .renderVideoStream(screen, session.screen, { scalingMode: "Fit" })
        .then((v) => (session.screenView = v));
    }
  });

  function pushURL() {
    if (URL.canParse(urlToPush))
      session.messenger?.send({ type: "push-url", url: urlToPush });
  }
</script>

<div class="flex size-full gap-4">
  <div class="flex-1 flex flex-col items-center justify-center mt-12">
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
      <span
        class:hidden={session.screen}
        class="text-neutral w-full text-center uppercase font-semibold absolute left-0 right-0 z-[1]"
        >Waiting for participant to share screen</span
      >
      <div
        bind:this={screen}
        class="w-full max-w-[1280px] min-w-[320px] aspect-video shadow-md border border-success bg-black rounded-box flex items-center justify-center"
      ></div>
      <div class="py-4 w-full max-w-[1280px] min-w-[320px] relative z-[2]">
        <form
          onsubmit={preventDefault(() => pushURL())}
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
            id="push"
            name="push"
            type="text"
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
  <Pane location="right" min="500" max="500" class="flex flex-col">
    <HostTools session={sessionRecord} />
  </Pane>
</div>
