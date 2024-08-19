<script lang="ts">
  import { onMount } from "svelte";
  import waveform from "wavesurfer.js";
  import theme from "@/utilities/theme";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
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
    timingBased?: boolean;
    handler: (e: ExtendedKeyboardEvent, combo: string) => void;
  };

  const minzoom = 10;
  const maxzoom = 1000;

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

  let ready: boolean = $state(false);
  let zoomLevel: number = $state(10);
  let scrubberFocused = $state(false);
  let width: number | null = $state(null);
  let token: string | null = $state(null);
  let wave: waveform | null = $state(null);
  let { video = $bindable() }: Props = $props();
  let scrubber: HTMLElement | null = $state(null);
  let clipRegion: ReturnType<(typeof regions)["addRegion"]> | null =
    $state(null);

  onMount(async () => {
    token = (await actions.tokens.getBlobToken({})).data ?? null;
  });

  $effect(() => {
    if (wave && store.utterances.active) {
      const utterance = store.utterances.active;
      const startMs = utterance.offset - utterance.duration;
      const endMs = startMs + utterance.duration;

      clipRegion = regions.addRegion({
        drag: true,
        resize: true,
        end: endMs / 1000,
        start: startMs / 1000,
        content: "Transcript Segment",
        color: "rgba(255, 0, 0, 0.1)",
      });
    }
  });

  $effect.pre(() => {
    if (video) resizer.unobserve(video);
  });

  $effect(() => {
    if (video) resizer.observe(video);
  });

  $effect(() => {
    if (video && wave) {
      const videoReady = new Promise((r) => (video!.oncanplaythrough = r));
      const waveReady = new Promise((r) => wave!.on("decode", r));
      Promise.all([videoReady, waveReady]).then(() => (ready = true));
    }
  });

  $effect(() => {
    if (scrubber && wave) {
      wave.on("click", () => (scrubberFocused = true));
    }
  });

  $effect(() => {
    if (video && scrubber) {
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
    }
  });

  function mark() {
    if (!video) return;

    if (clipRegion) {
      if (video.currentTime < clipRegion.start) {
        clipRegion.setOptions({
          drag: true,
          resize: true,
          end: clipRegion.start,
          start: video.currentTime,
          color: "rgba(255, 0, 0, 0.1)",
        });
      } else {
        clipRegion.setOptions({
          drag: true,
          resize: true,
          end: video.currentTime,
          start: clipRegion.start,
          color: "rgba(255, 0, 0, 0.1)",
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
    if (clipRegion) clipRegion.remove();
    clipRegion = null;
  }

  function createClip() {
    console.log("Clip it!");
  }

  function playPause() {
    if (video) video.paused ? video.play() : video.pause();
  }

  function zoom(e: WheelEvent) {
    const delta = e.deltaX || e.deltaY;
    const newZoom = delta > 0 ? zoomLevel * 0.9 : zoomLevel * 1.1;

    zoomLevel = Math.max(minzoom, Math.min(newZoom, maxzoom));

    if (wave) wave.zoom(zoomLevel);
  }

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
        description: "mark clip at cursor",
      },
      {
        key: "esc",
        handler: clear,
        description: "clear clip",
      },
      {
        key: "enter",
        handler: createClip,
        description: "create clip from selection",
      },
    ],
    [
      {
        key: "right",
        label: "&rarr;",
        handler: console.log,
        followon: ["n", "s", "m"],
        description: "move cursor forward ms/sec/min",
      },
      {
        key: "left",
        label: "&larr;",
        handler: console.log,
        followon: ["n", "s", "m"],
        description: "move cursor backward ms/sec/min",
      },
    ],
  ];

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
</script>

{#if store.recordings.active && token}
  {#await store.preloadRecordings(token)}
    <div class="size-full flex items-center justify-center">
      <span class="loading loading-spinner loading-lg"
        >Loading session videos...</span
      >
    </div>
  {:then _}
    {#if store.recordings.active}
      <div class="size-full flex flex-col gap-6">
        <div
          class:hidden={!ready}
          class="aspect-video max-w-[1280px] border bg-black rounded-box flex items-center justify-center overflow-clip"
        >
          <!-- svelte-ignore a11y_media_has_caption -->
          <video
            preload="auto"
            bind:this={video}
            class="size-full"
            src={store.recordings.preloaded[store.recordings.active.id]}
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
          class="bg-base-100/50 rounded p-4 max-w-[1280px] font-mono transition-opacity opacity-0 duration-300 ease-in-out"
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
    {/if}
  {/await}
{/if}

{#snippet keyboardShortcut(shortcut: KeyboardShortcut)}
  <div class="flex items-end text-xs">
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
        <kbd class="kbd bg-neutral-400">{@html shortcut.followon.join("/")}</kbd
        >
      </div>
    {/if}
    <hr class="flex-1 mx-2 border-base-100 border-dotted offset" />
    <span class="flex-none">{shortcut.description}</span>
  </div>
{/snippet}
