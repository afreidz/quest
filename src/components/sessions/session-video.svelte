<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";

  type Props = {
    video?: HTMLVideoElement | null;
  };

  let ready: boolean = $state(false);
  let token: string | null = $state(null);
  let { video = $bindable() }: Props = $props();

  onMount(async () => {
    token = (await actions.tokens.getBlobToken({})).data ?? null;
  });

  $effect(() => {
    if (video) {
      video.oncanplaythrough = () => (ready = true);
    }
  });
</script>

{#if store.recordings.active && token}
  {#await store.preloadRecordings(token)}
    <div class="size-full flex items-center justify-center">
      <span class="loading loading-spinner loading-lg"
        >Loading session videos...</span
      >
    </div>
  {:then _}
    <div
      class:hidden={!ready}
      class="aspect-video shadow-2xl max-w-[1280px] border border-success bg-black rounded-box flex items-center justify-center overflow-clip"
    >
      <!-- svelte-ignore a11y_media_has_caption -->
      <video
        controls
        preload="auto"
        bind:this={video}
        class="size-full"
        src={store.recordings.preloaded[store.recordings.active.id]}
      ></video>
    </div>
  {/await}
{/if}
