<script lang="ts" context="module">
  import type {
    AudioDeviceInfo,
    VideoDeviceInfo,
  } from "@azure/communication-calling";

  import { onMount } from "svelte";
  import session from "@/stores/session.svelte";

  export type DeviceSelectProps = {
    class?: string;
    open?: boolean;
    pip?: MediaStream;
  };

  type SelectElements = {
    mic?: HTMLSelectElement;
    camera?: HTMLSelectElement;
    speakers?: HTMLSelectElement;
  };

  type AvailableMedia = {
    mics: AudioDeviceInfo[];
    cameras: VideoDeviceInfo[];
    speakers: AudioDeviceInfo[];
  };

  type SelectedMedia = {
    mic: AudioDeviceInfo | null;
    camera: VideoDeviceInfo | null;
    speakers: AudioDeviceInfo | null;
  };
</script>

<script lang="ts">
  let {
    pip,
    open = false,
    class: className = "",
  }: DeviceSelectProps = $props();

  let flipped = $state(false);
  let selects: SelectElements = $state({});
  let preview: HTMLElement | null = $state(null);
  let dialog: HTMLDialogElement | null = $state(null);
  let pipVideo: HTMLVideoElement | null = $state(null);

  let available: AvailableMedia = $state({
    mics: [],
    cameras: [],
    speakers: [],
  });

  let selected: SelectedMedia = $state({
    mic: null,
    camera: null,
    speakers: null,
  });

  onMount(async () => {
    await session.getPermission();
    const dm = await session.deviceManager;

    available.cameras = (await dm?.getCameras()) ?? [];
    available.mics = (await dm?.getMicrophones()) ?? [];
    available.speakers = (await dm?.getSpeakers()) ?? [];

    if (localStorage.getItem("camera")) {
      const id = localStorage.getItem("camera");
      const existing = available.cameras.find((c) => c.id === id);
      if (existing) {
        selected.camera = existing;
        session.camera = selected.camera ?? undefined;
      }
    }

    if (localStorage.getItem("microphone")) {
      const id = localStorage.getItem("microphone");
      const existing = available.mics.find((m) => m.id === id);
      if (existing) {
        selected.mic = existing;
        session.microphone = selected.mic ?? undefined;
      }
    }

    if (localStorage.getItem("speakers")) {
      const id = localStorage.getItem("speakers");
      const existing = available.speakers.find((s) => s.id === id);
      if (existing) {
        selected.speakers = existing;
        session.speakers = selected.speakers ?? undefined;
      }
    }
  });

  $effect(() => {
    if (dialog && open) {
      dialog.showModal();
      setTimeout(() => (flipped = true), 10);
    }
  });

  $effect(() => {
    if (pip && pipVideo) {
      pipVideo.srcObject = pip;
    }
  });

  $effect(() => {
    if (flipped && preview && selected.camera) {
      session.renderCamera(preview, selected.camera);
    }
  });

  $effect(() => {
    if (!open) flipped = false;
  });

  function changeCamera() {
    open = true;
    selects.camera?.focus();
  }

  function changeMicrophone() {
    open = true;
    selects.mic?.focus();
  }

  function changeSpeakers() {
    open = true;
    selects.speakers?.focus();
  }

  function setDevices() {
    session.camera = selected.camera ?? undefined;
    session.microphone = selected.mic ?? undefined;
    session.speakers = selected.speakers ?? undefined;
  }
</script>

{#if open}
  <dialog class="modal" bind:this={dialog} onclose={() => (open = false)}>
    <div class:flipped class="flip transition-all duration-500 ease-out">
      <div class="flip-inner flip-inner relative size-full z-[1]">
        <div
          class="flip-front size-full modal-box bg-neutral border shadow-sm min-w-96 min-h-96"
        ></div>
        <form
          method="dialog"
          onsubmit={setDevices}
          class="modal-box bg-neutral border shadow-sm flip-back size-full min-w-96 min-h-96"
        >
          <label class="form-control w-full">
            <div class="label">
              <span class="label-text">Select a camera</span>
            </div>
            <select
              required
              bind:this={selects.camera}
              bind:value={selected.camera}
              class="select select-bordered bg-neutral disabled:bg-base-100/5"
            >
              <option disabled selected value={null}>Pick one</option>
              {#each available.cameras as camera}
                <option value={camera}>{camera.name}</option>
              {/each}
            </select>
          </label>

          <label class="form-control w-full">
            <div class="label">
              <span class="label-text">Select a microphone</span>
            </div>
            <select
              required
              bind:this={selects.mic}
              bind:value={selected.mic}
              class="select select-bordered bg-neutral disabled:bg-base-100/5"
            >
              <option disabled selected value={null}>Pick one</option>
              {#each available.mics as mic}
                <option value={mic}>{mic.name}</option>
              {/each}
            </select>
          </label>

          <label class="form-control w-full">
            <div class="label">
              <span class="label-text">Select speakers</span>
            </div>
            <select
              required
              bind:this={selects.speakers}
              bind:value={selected.speakers}
              class="select select-bordered bg-neutral disabled:bg-base-100/5"
            >
              <option disabled selected value={null}>Pick one</option>
              {#each available.speakers as speaker}
                <option value={speaker}>{speaker.name}</option>
              {/each}
            </select>
          </label>
          <footer class="modal-action">
            <button
              type="button"
              onclick={() => dialog?.close()}
              class="btn btn-ghost">Cancel</button
            >
            <button type="submit" class="btn btn-primary">Apply</button>
          </footer>
        </form>
      </div>
    </div>
  </dialog>
{/if}
<ul class="join">
  {#if pip}
    <li class="join-item btn btn-ghost btn-sm">
      <button
        class="size-full tooltip tooltip-top"
        onclick={() => pipVideo?.requestPictureInPicture()}
        data-tip={`Cameras for participants will only be displayed in "Picture-In-Picture (PIP)" mode to avoid duplicating the camera feeds on the screen recording. Click here to open them in PIP mode.`}
      >
        <iconify-icon icon="material-symbols:pip"></iconify-icon>
      </button>
    </li>
  {/if}
  <li class="join-item btn btn-ghost btn-sm p-0">
    <button
      onclick={changeCamera}
      data-tip="Change Camera"
      class="size-full tooltip tooltip-top px-3"
    >
      <iconify-icon icon="mdi:webcam"></iconify-icon>
    </button>
  </li>
  <li class="join-item btn btn-ghost btn-sm p-0">
    <button
      onclick={changeMicrophone}
      data-tip="Change Microphone"
      class="size-full tooltip tooltip-top px-3"
    >
      <iconify-icon icon="mdi:microphone"></iconify-icon>
    </button>
  </li>
  <li class="join-item btn btn-ghost btn-sm p-0">
    <button
      onclick={changeSpeakers}
      data-tip="Change Speakers"
      class="size-full tooltip tooltip-top px-3"
    >
      <iconify-icon icon="mdi:speaker"></iconify-icon>
    </button>
  </li>
</ul>

{#if pip}
  <!-- svelte-ignore a11y_media_has_caption -->
  <video class="hidden" autoplay muted bind:this={pipVideo}></video>
{/if}

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
