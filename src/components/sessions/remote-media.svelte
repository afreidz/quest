<script lang="ts">
  import sessionState from "@/stores/session.svelte";

  type Props = {
    size?: "xs" | "sm" | "md" | "lg" | "xl";
  };

  let { size = "md" }: Props = $props();
  let remoteCamera: HTMLElement | null = $state(null);

  $effect(() => {
    if (sessionState.remote.camera && remoteCamera) {
      remoteCamera.replaceChildren(sessionState.remote.camera.target);
    }
  });
</script>

<div
  class="flip aspect-square"
  class:size-96={size === "md"}
  class:size-52={size === "sm"}
  class:size-48={size === "xs"}
  class:size-[320px]={size === "lg"}
  class:size-[500px]={size === "xl"}
  class:flipped={sessionState.remote.camera}
>
  <div class="flip-inner relative size-full">
    <div
      class="flip-front bg-neutral rounded-box border shadow-sm overflow-clip size-full p-6 flex items-center justify-center"
    >
      <strong
        class:text-sm={["xs", "sm"].includes(size)}
        class="uppercase font-semibold opacity-50 block text-pretty"
        >Waiting for {sessionState.remote.name}</strong
      >
    </div>
    <div class="flip-back rounded-box overflow-clip bg-black">
      {#if sessionState.remote.name}
        <div
          class="glass absolute badge badge-outline badge-xs bottom-2 left-2 z-[1]"
        >
          {sessionState.remote.name}
        </div>
      {/if}
      <div class="flex w-full h-full items-center justify-center">
        <div
          bind:this={remoteCamera}
          class="flex-1 aspect-square"
          class:hidden={!sessionState.remote.camera}
        ></div>
      </div>
    </div>
  </div>
</div>

<style>
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
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
