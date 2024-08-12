<script lang="ts">
  import session from "@/stores/session.svelte";
  import Pane from "@/components/app/pane.svelte";
  import type { SessionById } from "@/actions/sessions";
  import Actions from "@/components/sessions/actions.svelte";
  import { LocalVideoStream } from "@azure/communication-calling";
  import HostTools from "@/components/sessions/host-tools.svelte";
  import Participant from "@/components/sessions/participant-view.svelte";

  type Props = {
    session: SessionById;
  };

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
      class="w-full flex-1 flex items-center justify-center my-4 relative"
    >
      <span
        class:hidden={session.screen}
        class="text-neutral w-full text-center uppercase font-semibold absolute left-0 right-0 z-[1]"
        >Waiting for participant to share screen</span
      >
      <div
        bind:this={screen}
        class="w-full max-w-[1280px] min-w-[320px] aspect-video shadow-2xl border border-success bg-black rounded-box flex items-center justify-center"
      ></div>
    </section>
    <Actions />
  </div>
  <Pane location="right" min="500" max="500">
    <HostTools session={sessionRecord} />
  </Pane>
</div>
