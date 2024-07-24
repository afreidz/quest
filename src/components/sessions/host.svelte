<script lang="ts">
  import { v4 as uuid } from "uuid";
  import { actions } from "astro:actions";
  import sessionState from "@/stores/session.svelte";
  import type { SessionFromAll } from "@/actions/sessions";
  import LocalMedia from "@/components/sessions/local-media.svelte";
  import RemoteMedia from "@/components/sessions/remote-media.svelte";

  type Props = {
    session: SessionFromAll;
  };

  let { session }: Props = $props();

  $effect(() => {
    const callId = uuid();
    actions.sessions.updateById({ id: session.id, data: { callId } });
    sessionState.id = callId;
    sessionState.setLocalName(session.moderator);
    sessionState.setRemoteName(
      session.respondent.name || session.respondent.email,
    );
  });
</script>

<div class="flex flex-col items-center justify-center m-6 gap-4">
  <div class="flex gap-4">
    {#if sessionState.connected}
      <RemoteMedia size="sm" />
    {/if}
    <LocalMedia
      allowNameChange={true}
      size={sessionState.connected ? "sm" : "md"}
    />
  </div>

  <div
    class="tooltip-secondary tooltip-bottom"
    class:tooltip={!sessionState.mediaReady}
    data-tip="Please select all media before joining"
  >
    {#if sessionState.connected}
      <button
        disabled={sessionState.connecting}
        onclick={() => sessionState.leave()}
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
</div>
