<script lang="ts">
  import session from "@/stores/session.svelte";
  import DeviceSelect from "@/components/sessions/device-select.svelte";

  type Props = {
    class?: string;
  };

  let { class: className = "" }: Props = $props();
</script>

<footer class="flex-none flex w-full justify-evenly items-center {className}">
  <div class="flex items-end flex-1 gap-3">
    {#if session.status === "Connected"}
      <button onclick={() => session.disconnect()} class="btn btn-error"
        >End Session</button
      >
    {/if}
  </div>
  <DeviceSelect pip={session.pip} class="flex-1" />
  <div class="flex justify-end flex-1">
    {#if session.status === "Connected"}
      <ul class="join">
        <li
          class="btn btn-outline join-item"
          class:text-error={session.muted}
          class:border-error={session.muted}
        >
          <button
            onclick={() => (session.muted ? session.unmute() : session.mute())}
            class="size-full flex items-center gap-2"
          >
            <iconify-icon icon="mdi:microphone{session.muted ? '-off' : ''}"
            ></iconify-icon>
            <span>{session.muted ? "Unmute" : "Mute"} microphone</span>
          </button>
        </li>
        <li
          class="btn btn-outline join-item"
          class:btn-disabled={!session.camera}
          class:text-error={!session.camEnabled}
          class:border-error={!session.camEnabled}
        >
          <button
            disabled={!session.camera}
            onclick={() =>
              session.camEnabled
                ? session.disableCamera()
                : session.enableCamera()}
            class="size-full flex items-center gap-2"
          >
            <iconify-icon icon="mdi:webcam{!session.camEnabled ? '-off' : ''}"
            ></iconify-icon>
            <span>Turn {session.camEnabled ? "off" : "on"} camera</span>
          </button>
        </li>
      </ul>
    {/if}
  </div>
</footer>
