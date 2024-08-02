<script lang="ts" context="module">
  import type {
    LocalVideoStream,
    RemoteVideoStream,
  } from "@azure/communication-calling";

  import session from "@/stores/session.svelte";

  export type CameraFeedProps = {
    id: string;
    name?: string;
    class?: string;
    muted?: boolean;
    online?: boolean;
    speaking?: boolean;
    bootable?: boolean;
    feed?: LocalVideoStream | RemoteVideoStream;
  };
</script>

<script lang="ts">
  let {
    id,
    name,
    online,
    muted = false,
    bootable = false,
    speaking = false,
    feed = $bindable(),
    class: className = "",
  }: CameraFeedProps = $props();

  let flipped = $derived(!!feed);
  let view: HTMLElement | null = $state(null);

  $effect(() => {
    if (flipped && view && feed) {
      session.renderVideoStream(view, feed);
    }
  });
</script>

<div
  class:flipped
  class="flip aspect-square transition-all duration-500 ease-out {className}"
>
  <div class="flip-inner relative size-full z-[1] group">
    <div
      class="flip-front bg-neutral shadow-sm rounded-box border size-full p-2 pb-1 flex flex-col items-center justify-center gap-4"
    >
      <div class="flex-1 flex items-center justify-center">
        <div
          class="avatar {online
            ? 'online'
            : ''} placeholder before:!outline-neutral"
        >
          <div class="bg-base-100/50 text-neutral-400 w-28 rounded-full">
            <span class="text-[80px]"
              >{name?.charAt(0).toLocaleUpperCase() ?? "?"}</span
            >
          </div>
        </div>
      </div>
      <div>
        <div class="badge badge-sm badge-outline">{name}</div>
      </div>
      <div class="badge glass absolute top-1 left-1">
        <iconify-icon
          class:text-error={muted}
          class:text-success={speaking}
          class:text-neutral-950={!muted}
          icon="mdi:microphone{muted ? '-off' : ''}"
        ></iconify-icon>
      </div>
      {#if bootable}
        <button
          onclick={() => session.bootParticipant(id)}
          data-tip="Remove Participant"
          class="transition-opacity opacity-0 group-hover:opacity-100 tooltip tooltip-left tooltip-secondary rounded-full aspect-square absolute top-1 right-1 text-error"
        >
          <iconify-icon icon="mdi:ban"></iconify-icon>
        </button>
      {/if}
    </div>
    <div class="flip-back bg-black shadow-sm rounded-box relative">
      <div
        bind:this={view}
        class="w-full aspect-square fade rounded-box overflow-clip"
      ></div>
      {#if name}
        <div
          class="absolute bottom-0 left-0 right-0 flex justify-center items-end p-1 h-10 after:bg-gradient-to-t from-black to-transparent"
        >
          <div class="badge badge-sm glass text-neutral">{name}</div>
        </div>
      {/if}
      <div class="badge glass absolute top-1 left-1 text-error">
        <iconify-icon
          class:text-error={muted}
          class:text-success={speaking}
          class:text-neutral-950={!muted}
          icon="mdi:microphone{muted ? '-off' : ''}"
        ></iconify-icon>
      </div>
      {#if bootable}
        <button
          onclick={() => session.bootParticipant(id)}
          data-tip="Remove Participant"
          class="transition-opacity opacity-0 group-hover:opacity-100 tooltip tooltip-left tooltip-secondary rounded-full aspect-square absolute top-1 right-1 text-error"
        >
          <iconify-icon icon="mdi:ban"></iconify-icon>
        </button>
      {/if}
    </div>
  </div>
</div>

<style lang="postcss">
  .flip {
    perspective: 1000px;
  }

  .flip .flip-inner {
    transition: transform 0.6s;
    transform-style: preserve-3d;
  }

  .flip.flipped .flip-inner {
    transform: rotateY(180deg);
  }

  .flip .flip-front,
  .flip .flip-back {
    backface-visibility: hidden;
  }

  .flip .flip-front {
    transform: rotateY(0deg);
  }

  .flip .flip-back {
    transform: rotateY(180deg);
    @apply absolute top-0 left-0;
  }
</style>
