<script lang="ts">
  import sessionState from "@/stores/session.svelte";
  import type { SessionFromAll } from "@/actions/sessions";
  import Media from "@/components/sessions/local-media.svelte";

  type Props = {
    session: SessionFromAll;
  };

  let { session }: Props = $props();
  let camera: HTMLVideoElement | undefined = $state();

  $effect(() => {
    if (!session.id) return;
    sessionState.setId(session.roomComsId);
    sessionState.setRemoteName(session.moderator);
    sessionState.setRemoteId(session.moderatorComsId);
    sessionState.setLocalId(session.respondent.comsId);
    sessionState.setLocalName(
      session.respondent.name || session.respondent.email,
    );
  });
</script>

<svelte:window
  onbeforeunload={async () => {
    await sessionState.leave();
  }}
/>

<div class="flex-1 flex flex-col items-center justify-center m-6 gap-4">
  {#if sessionState.connected}
    <div class="flex-1 flex flex-col items-center justify-center">Content</div>
  {/if}

  <Media pipCameras bind:cameraVideoElement={camera} />

  <div class="flex gap-4">
    <div
      class="tooltip-secondary tooltip-bottom"
      class:tooltip={!sessionState.mediaReady}
      data-tip="Please select all media before joining"
    >
      {#if sessionState.connected}
        <button
          disabled={sessionState.connecting}
          onclick={() => {
            if (document.pictureInPictureElement) {
              document.exitPictureInPicture();
            }
            sessionState.leave();
          }}
          class="btn btn-error flex items-center"
        >
          {#if sessionState.connecting}<span
              class="loading loading-spinner loading-sm"
            ></span>{/if}
          <span>Leave</span>
        </button>
      {:else}
        <button
          onclick={() => sessionState.join()}
          class="btn btn-primary flex items-center"
          disabled={sessionState.connecting || !sessionState.mediaReady}
        >
          {#if sessionState.connecting}<span
              class="loading loading-spinner loading-sm"
            ></span>{/if}
          <span>Join</span>
        </button>
      {/if}
    </div>
    {#if sessionState.connected}
      <div
        class="tooltip tooltip-secondary tooltip-top"
        data-tip="Video is enabled only in PIP mode to prevent video from duplicating on the moderator's screen share view. Click here to launch the cameras in PIP mode"
      >
        <button
          class="btn btn-outline"
          onclick={() => {
            if (camera) camera.requestPictureInPicture();
          }}
        >
          <iconify-icon icon="mdi:webcam"></iconify-icon>
        </button>
      </div>
    {/if}
  </div>
</div>
