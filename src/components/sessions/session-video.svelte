<script lang="ts">
  import Color from "color";
  import { onMount } from "svelte";
  import waveform from "wavesurfer.js";
  import theme from "@/utilities/theme";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import messages from "@/stores/messages.svelte";
  import { preventDefault } from "@/utilities/events";
  import mousetrap, { type ExtendedKeyboardEvent } from "mousetrap";
  import MinimapPlugin from "wavesurfer.js/dist/plugins/minimap.esm.js";
  import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
  import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";

  type Props = {
    video?: HTMLVideoElement | null;
  };

  type KeyboardShortcut = {
    key: string;
    label?: string;
    followon?: string[];
    description: string;
    clipBased?: boolean;
    hideForClips?: boolean;
    handler: (e: ExtendedKeyboardEvent, combo: string) => void;
  };

  const shortcuts: KeyboardShortcut[][] = [
    [
      {
        key: "space",
        handler: playPause,
        description: "play / pause",
      },
      {
        key: "m",
        handler: mark,
        hideForClips: true,
        description: "mark clip at cursor",
      },
      {
        key: "esc",
        handler: clear,
        clipBased: true,
        hideForClips: true,
        description: "clear clip",
      },
      {
        key: "enter",
        clipBased: true,
        hideForClips: true,
        handler: createClip,
        description: "create clip from selection",
      },
    ],
    [
      {
        key: "l",
        clipBased: true,
        hideForClips: true,
        handler: loopRegion,
        description: "loop current clip",
      },
      {
        key: "right",
        label: "&rarr;",
        followon: ["n", "s", "m"],
        handler: promptJumpForward,
        description: "move cursor forward ms/sec/min",
      },
      {
        key: "left",
        label: "&larr;",
        followon: ["n", "s", "m"],
        handler: promptJumpBackward,
        description: "move cursor backward ms/sec/min",
      },
    ],
  ];

  const minzoom = 10;
  const maxzoom = 1000;
  const regionColor = Color(theme.error).alpha(0.2).rgb().string();

  const regions = RegionsPlugin.create();
  const timeline = TimelinePlugin.create();
  const minimap = MinimapPlugin.create({
    height: 40,
    waveColor: theme.secondary,
    progressColor: theme.secondary,
  });

  const resizer = new ResizeObserver((entries) => {
    const entry = entries.find((e) => e.target === video);
    if (entry) width = entry.contentRect.width;
  });

  let loop = $state(false);
  let loading = $state(true);
  let showJump = $state(false);
  let zoomLevel: number = $state(10);
  let jumpAmount: number = $state(0);
  let readyToLoadWave = $state(false);
  let scrubberFocused = $state(false);
  let width: number | null = $state(null);
  let token: string | null = $state(null);
  let wave: waveform | null = $state(null);
  let { video = $bindable() }: Props = $props();
  let scrubber: HTMLElement | null = $state(null);
  let jumpUnit: "ms" | "s" | "m" | null = $state(null);
  let jumpModal: HTMLDialogElement | null = $state(null);
  let jumpDirection: "forward" | "backward" | null = $state(null);
  let clipRegion: ReturnType<(typeof regions)["addRegion"]> | null =
    $state(null);

  onMount(async () => {
    token = (await actions.tokens.getBlobToken({})).data ?? null;

    regions.on("region-out", (region) => {
      if (clipRegion === region && loop) clipRegion.play();
    });
    loading = false;
  });

  $effect(() => {
    if (wave && store.utterances.active) {
      const utterance = store.utterances.active;
      const startMs = utterance.offset - utterance.duration;
      const endMs = startMs + utterance.duration;

      regions.clearRegions();

      clipRegion = regions.addRegion({
        drag: true,
        resize: true,
        end: endMs / 1000,
        color: regionColor,
        start: startMs / 1000,
        content: "Transcript Segment",
      });
    }
  });

  $effect(() => {
    if (video) resizer.observe(video);
  });

  $effect(() => {
    if (showJump) jumpModal?.showModal();
  });

  $effect(() => {
    if (store.recordings.active?.videoURL && video) {
      readyToLoadWave = false;
      if (scrubber) scrubber.innerHTML = "";

      video.src =
        store.recordings.preloaded[store.recordings.active.id] ||
        store.recordings.active.videoURL;

      video.oncanplaythrough = () => (readyToLoadWave = true);
    }
  });

  $effect(() => {
    if (wave) wave.on("click", () => (scrubberFocused = true));
  });

  $effect(() => {
    if (readyToLoadWave && video && scrubber) {
      wave = waveform.create({
        media: video,
        cursorWidth: 3,
        minPxPerSec: 10,
        autoplay: false,
        normalize: false,
        fillParent: true,
        autoScroll: true,
        autoCenter: true,
        dragToSeek: false,
        container: scrubber,
        cursorColor: theme.info,
        waveColor: theme.secondary,
        progressColor: theme.primary,
        plugins: [regions, timeline, minimap],
      });

      scrubber.focus();
      scrubberFocused = true;
    }
  });

  $effect(() => {
    mousetrap.reset();
    if (scrubberFocused) {
      shortcuts.flat().forEach((sc) => {
        if (sc.followon) {
          sc.followon.forEach((fo) => {
            mousetrap.bind(`${sc.key} ${fo}`, sc.handler);
          });
        } else {
          mousetrap.bind(sc.key, sc.handler);
        }
      });
    }
  });

  function mark() {
    if (!video) return;
    if (store.recordings.active?.type === "CLIP") return;

    if (clipRegion) {
      const existing = clipRegion.start;
      clipRegion.remove();

      if (video.currentTime < existing) {
        clipRegion = regions.addRegion({
          drag: true,
          resize: true,
          content: "Clip",
          color: regionColor,
          end: clipRegion.start,
          start: video.currentTime,
        });
      } else {
        clipRegion = regions.addRegion({
          drag: true,
          resize: true,
          content: "Clip",
          color: regionColor,
          end: video.currentTime,
          start: clipRegion.start,
        });
      }
    } else {
      clipRegion = regions.addRegion({
        drag: true,
        resize: true,
        content: "Clip",
        start: video.currentTime,
      });
    }
  }

  function clear() {
    if (store.recordings.active?.type === "CLIP") return;
    if (clipRegion) clipRegion.remove();
    clipRegion = null;
  }

  async function createClip() {
    if (store.recordings.active?.type === "CLIP") return;
    if (!store.recordings.active || !clipRegion) return;

    const url =
      store.recordings.preloaded[store.recordings.active.id] ||
      store.recordings.active.videoURL;

    if (!url) return;

    loading = true;
    const clip = await actions.sessions.createClip({
      start: clipRegion.start,
      recordingId: store.recordings.active.id,
      duration: clipRegion.end ? clipRegion.end - clipRegion.start : undefined,
    });
    loading = false;

    if (clip.error) {
      messages.error("Unable to create clip", clip.error);
    }

    regions.clearRegions();
    await store.refreshActiveSession();
    if (clip.data) store.setActiveRecording(clip.data);
  }

  function playPause() {
    if (video) {
      if (clipRegion) video.paused ? clipRegion.play() : video.pause();
      if (!clipRegion) video.paused ? video.play() : video.pause();
    }
  }

  function zoom(e: WheelEvent) {
    const delta = e.deltaX || e.deltaY;
    const newZoom = delta > 0 ? zoomLevel * 0.9 : zoomLevel * 1.1;

    zoomLevel = Math.max(minzoom, Math.min(newZoom, maxzoom));

    if (wave) wave.zoom(zoomLevel);
  }

  function loopRegion() {
    if (!video) return;
    if (!clipRegion) return;
    if (store.recordings.active?.type === "CLIP") return;

    loop = !loop;

    if (!loop) video.pause();
    if (loop) clipRegion.play();
  }

  function promptJumpForward(e: KeyboardEvent) {
    jumpDirection = "forward";
    jumpUnit =
      e.key === "n" ? "ms" : e.key === "s" ? "s" : e.key === "m" ? "m" : null;
    showJump = true;
  }

  function promptJumpBackward(e: KeyboardEvent) {
    jumpDirection = "backward";
    jumpUnit =
      e.key === "n" ? "ms" : e.key === "s" ? "s" : e.key === "m" ? "m" : null;
    showJump = true;
  }

  function handleJump() {
    showJump = false;
    if (!jumpAmount || !video) return;

    const jumpSeconds =
      jumpUnit === "s"
        ? jumpAmount
        : jumpUnit === "ms"
          ? jumpAmount / 1000
          : jumpUnit === "m"
            ? jumpAmount * 60
            : 0;

    video.currentTime =
      jumpDirection === "forward"
        ? video.currentTime + jumpSeconds
        : video.currentTime - jumpSeconds;

    jumpAmount = 0;
    jumpUnit = null;
    jumpDirection = null;
  }
</script>

{#snippet loadingState()}
  <div
    class="aspect-video bg-black rounded-box w-full max-w-[1280px] flex items-center justify-center"
  >
    <span class="loading loading-spinner loading-lg text-neutral"
      >Loading session videos...</span
    >
  </div>
{/snippet}

{#if loading}
  {@render loadingState()}
{:else if store.recordings.active && token}
  {#await store.preloadRecordings(token)}
    {@render loadingState()}
  {:then _}
    <div class="size-full flex flex-col gap-6">
      <div
        class="aspect-video max-w-[1280px] border bg-black rounded-box flex items-center justify-center overflow-clip"
      >
        <!-- svelte-ignore a11y_media_has_caption -->
        <video controls preload="auto" bind:this={video} class="size-full"
        ></video>
      </div>
      <button
        onwheel={zoom}
        bind:this={scrubber}
        class:outline={scrubberFocused}
        onblur={() => (scrubberFocused = false)}
        style={width ? `max-width: ${width}px;` : ""}
        class="rounded-box border bg-neutral outline-secondary outline-2 overflow-clip"
      ></button>
      <footer
        class:opacity-100={scrubberFocused}
        class="bg-base-100/50 rounded-box p-4 max-w-[1280px] font-mono transition-opacity opacity-0 duration-300 ease-in-out"
      >
        <strong class="block w-full flex-1 mb-4 font-semibold text-center"
          >Keyboard Shortcuts</strong
        >
        <div class="flex flex-wrap gap-4">
          {#each shortcuts as col}
            <ul
              class="flex-1 flex flex-col gap-2 border-r last:border-r-0 border-base-100 pr-4 max-w-96"
            >
              {#each col as shortcut}
                <li>{@render keyboardShortcut(shortcut)}</li>
              {/each}
            </ul>
          {/each}
        </div>
      </footer>
    </div>
  {/await}
{/if}

{#snippet keyboardShortcut(shortcut: KeyboardShortcut)}
  {#if store.recordings.active?.type !== "CLIP" || !shortcut.hideForClips}
    <div
      class:opacity-20={shortcut.clipBased && !clipRegion}
      class="flex items-end text-xs"
    >
      {#if !shortcut.followon}
        <kbd class="kbd bg-neutral-400 flex-none"
          >{@html shortcut.label || shortcut.key}</kbd
        >
      {:else}
        <div class="flex items-center gap-1 flex-none">
          <kbd class="kbd bg-neutral-400 flex-none"
            >{@html shortcut.label || shortcut.key}</kbd
          >
          +
          <kbd class="kbd bg-neutral-400"
            >{@html shortcut.followon.join("/")}</kbd
          >
        </div>
      {/if}
      <hr class="flex-1 mx-2 border-base-100 border-dotted offset" />
      <span class="flex-none">{shortcut.description}</span>
    </div>
  {/if}
{/snippet}

{#if showJump && jumpUnit}
  <dialog
    bind:this={jumpModal}
    class="modal"
    onclose={() => {
      scrubber?.focus();
      scrubberFocused = true;
    }}
  >
    <form class="modal-box bg-neutral" onsubmit={preventDefault(handleJump)}>
      <h3 class="text-lg font-bold">Move cursor</h3>
      <label class="py-4">
        Number of {jumpUnit === "m"
          ? "minutes"
          : jumpUnit === "ms"
            ? "milliseconds"
            : jumpUnit === "s"
              ? "seconds"
              : ""}
        <input
          min="1"
          required
          max="50000"
          type="number"
          bind:value={jumpAmount}
          class="input input-bordered bg-neutral"
        />
      </label>
      <div class="modal-action">
        <button
          type="button"
          onclick={() => (showJump = false)}
          class="btn btn-ghost">Cancel</button
        >
        <button type="submit" class="btn btn-primary">Jump</button>
      </div>
    </form>
  </dialog>
{/if}
