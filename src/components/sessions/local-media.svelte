<script lang="ts">
  import {
    type DeviceManager,
    type AudioDeviceInfo,
    type VideoDeviceInfo,
  } from "@azure/communication-calling";

  import { onMount } from "svelte";
  import sessionState from "@/stores/session.svelte";
  import { combineCameraStreams } from "@/utilities/video";

  type Props = {
    pipCameras?: boolean;
    allowNameChange?: boolean;
    cameraVideoElement?: HTMLVideoElement;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
  };

  let {
    allowNameChange,
    size = $bindable("md"),
    pipCameras = $bindable(false),
    cameraVideoElement = $bindable(),
  }: Props = $props();

  let changingMedia = $state(false);
  let name: string | undefined = $state();
  let mics: AudioDeviceInfo[] = $state([]);
  let cameras: VideoDeviceInfo[] = $state([]);
  let speakers: AudioDeviceInfo[] = $state([]);
  let localCamera: HTMLElement | undefined = $state();
  let selectedMic: AudioDeviceInfo | undefined = $state();
  let combindedStream: MediaStream | undefined = $state();
  let deviceManager: DeviceManager | undefined = $state();
  let selectedCamera: VideoDeviceInfo | undefined = $state();
  let selectedSpeakers: AudioDeviceInfo | undefined = $state();
  let flip = $derived(sessionState.connected ? !pipCameras : true);

  onMount(async () => {
    deviceManager = await sessionState.deviceManager;
  });

  $effect(() => {
    const local = sessionState.local.stream;
    const remote = sessionState.remote.stream;

    if (!local && !remote) {
      combindedStream = undefined;
    } else if (local && !remote) {
      local.getMediaStream().then((stream) => (combindedStream = stream));
    } else if (!local && remote) {
      remote.getMediaStream().then((stream) => (combindedStream = stream));
    } else if (local && remote) {
      Promise.all([local.getMediaStream(), remote.getMediaStream()]).then(
        ([local, remote]) => {
          combineCameraStreams(local, remote, 300).then(
            (stream) => (combindedStream = stream),
          );
        },
      );
    } else {
      combindedStream = undefined;
    }
  });

  $effect(() => {
    if (sessionState.local.name && !name) {
      name = sessionState.local.name;
    } else {
      sessionState.setLocalName(name);
    }
  });

  $effect(() => {
    if (!selectedCamera) return;
    sessionState.setVideo(selectedCamera);
    changingMedia = false;
  });

  $effect(() => {
    if (!selectedMic) return;
    sessionState.setMicrophone(selectedMic);
    if (deviceManager) deviceManager.selectMicrophone(selectedMic);
    changingMedia = false;
  });

  $effect(() => {
    if (!selectedSpeakers || !deviceManager) return;
    sessionState.setSpeakers(selectedSpeakers);
    deviceManager.selectSpeaker(selectedSpeakers);
    changingMedia = false;
  });

  $effect(() => {
    if (sessionState.local.camera && localCamera) {
      localCamera.replaceChildren(sessionState.local.camera.target);
    }
  });

  $effect(() => {
    if (!sessionState.connected && !sessionState.connecting) {
      changingMedia = true;
      selectedMic = undefined;
      selectedCamera = undefined;
      selectedSpeakers = undefined;
    }
  });

  $effect(() => {
    if (deviceManager) {
      deviceManager.on("audioDevicesUpdated", (e) => {
        mics = [...mics, ...e.added].filter(
          (m) =>
            m.deviceType === "Microphone" &&
            !e.removed.map((r) => r.id).includes(m.id),
        );
        speakers = [...speakers, ...e.added].filter(
          (m) =>
            m.deviceType === "Speaker" &&
            !e.removed.map((r) => r.id).includes(m.id),
        );
      });
      deviceManager.on("videoDevicesUpdated", (e) => {
        cameras = [...cameras, ...e.added].filter(
          (m) => !e.removed.map((r) => r.id).includes(m.id),
        );
      });
    }
  });

  $effect(() => {
    if (!deviceManager) return;
    if (sessionState.permission) {
      deviceManager.getCameras().then((c) => (cameras = c));
      deviceManager.getMicrophones().then((m) => (mics = m));
      deviceManager.getSpeakers().then((s) => (speakers = s));
    } else {
      sessionState.getPermission();
    }
  });

  $effect(() => {
    if (cameraVideoElement && combindedStream) {
      cameraVideoElement.srcObject = combindedStream;
    }
  });
</script>

<div
  class:flip
  class:static={!flip}
  class:size-96={size === "md" && !pipCameras}
  class:size-52={size === "sm" && !pipCameras}
  class:size-48={size === "xs" && !pipCameras}
  class:size-[320px]={size === "lg" && !pipCameras}
  class:size-[500px]={size === "xl" && !pipCameras}
  class="aspect-square transition-all duration-500 ease-out"
  class:flipped={selectedMic &&
    selectedCamera &&
    !changingMedia &&
    selectedSpeakers}
>
  <div class="flip-inner relative size-full z-[1]">
    <div
      class="flip-front bg-neutral rounded-box border shadow-sm overflow-clip size-full p-6"
    >
      <label class="form-control w-full">
        <div class="label">
          <span class="label-text" class:text-xs={["xs", "sm"].includes(size)}
            >Select a camera</span
          >
        </div>
        <select
          bind:value={selectedCamera}
          class:select-xs={size === "xs"}
          class:select-sm={size === "sm"}
          class:select-lg={size === "lg"}
          class:select-xl={size === "xl"}
          class="select select-bordered bg-neutral"
        >
          <option disabled selected value={undefined}>Pick one</option>
          {#each cameras as camera}
            <option value={camera}>{camera.name}</option>
          {/each}
        </select>
      </label>

      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text" class:text-xs={["xs", "sm"].includes(size)}
            >Select a microphone</span
          >
        </div>
        <select
          bind:value={selectedMic}
          class:select-xs={size === "xs"}
          class:select-sm={size === "sm"}
          class:select-lg={size === "lg"}
          class:select-xl={size === "xl"}
          class="select select-bordered select-xs bg-neutral"
        >
          <option disabled selected value={undefined}>Pick one</option>
          {#each mics as mic}
            <option value={mic}>{mic.name}</option>
          {/each}
        </select>
      </label>

      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text" class:text-xs={["xs", "sm"].includes(size)}
            >Select speakers</span
          >
        </div>
        <select
          bind:value={selectedSpeakers}
          class:select-xs={size === "xs"}
          class:select-sm={size === "sm"}
          class:select-lg={size === "lg"}
          class:select-xl={size === "xl"}
          class="select select-bordered select-xs bg-neutral"
        >
          <option disabled selected value={undefined}>Pick one</option>
          {#each speakers as speaker}
            <option value={speaker}>{speaker.name}</option>
          {/each}
        </select>
      </label>

      <label class="form-control w-full max-w-xs">
        <div class="label">
          <span class="label-text" class:text-xs={["xs", "sm"].includes(size)}
            >{#if allowNameChange}Set{/if} Display Name</span
          >
        </div>
        <input
          type="text"
          bind:value={name}
          disabled={!allowNameChange}
          class:input-xs={size === "xs"}
          class:input-sm={size === "sm"}
          class:input-lg={size === "lg"}
          class:input-xl={size === "xl"}
          class="input input-bordered input-xs bg-neutral disabled:bg-base-100/20"
        />
      </label>
    </div>
    <div class:bg-black={flip} class="flip-back rounded-box overflow-clip">
      {#if !pipCameras || !sessionState.connected}
        {#if sessionState.local.name}
          <div
            class:glass={flip}
            class:absolute={flip}
            class="badge badge-outline badge-xs bottom-2 right-2 z-[1]"
          >
            {sessionState.local.name}
          </div>
        {/if}
        <div class="flex w-full h-full items-center justify-center">
          <div
            bind:this={localCamera}
            class="flex-1 aspect-square"
            class:hidden={!sessionState.local.camera}
          ></div>
        </div>
      {:else if pipCameras}
        <!-- svelte-ignore a11y_media_has_caption -->
        <video
          autoplay
          bind:this={cameraVideoElement}
          class="absolute z-[0] w-0 h-0"
        ></video>
      {/if}
      {#if !sessionState.connected && flip}
        <ul
          class:glass={flip}
          class:absolute={flip}
          class="join top-2 right-2 z-[1]"
        >
          <li
            class:text-neutral={flip}
            class:hover:bg-neutral={flip}
            class:hover:text-neutral-950={flip}
            class="join-item btn btn-ghost btn-sm"
          >
            <button
              data-tip="Change Camera"
              onclick={() => (changingMedia = true)}
              class="size-full tooltip tooltip-left"
            >
              <iconify-icon icon="mdi:webcam"></iconify-icon>
            </button>
          </li>
          <li
            class:text-neutral={flip}
            class:hover:bg-neutral={flip}
            class:hover:text-neutral-950={flip}
            class="join-item btn btn-ghost btn-sm"
          >
            <button
              data-tip="Change Microphone"
              onclick={() => (changingMedia = true)}
              class="size-full tooltip tooltip-left"
            >
              <iconify-icon icon="mdi:microphone"></iconify-icon>
            </button>
          </li>
          <li
            class:text-neutral={flip}
            class:hover:bg-neutral={flip}
            class:hover:text-neutral-950={flip}
            class="join-item btn btn-ghost btn-sm"
          >
            <button
              data-tip="Change Speakers"
              onclick={() => (changingMedia = true)}
              class="size-full tooltip tooltip-left"
            >
              <iconify-icon icon="mdi:speaker"></iconify-icon>
            </button>
          </li>
        </ul>
      {/if}
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

  .static .flip-back {
    display: none;
  }

  .static.flipped .flip-back {
    display: initial;
  }

  .static.flipped .flip-front {
    display: none;
  }
</style>
