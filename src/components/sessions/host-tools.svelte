<script lang="ts">
  import store from "@/stores/global.svelte";
  import Checklist from "@/components/sessions/checklist.svelte";
  import type { SessionById, SessionFromAll } from "@/actions/sessions";

  type Props = {
    session?: SessionFromAll | SessionById;
  };

  let { session: passedSession }: Props = $props();
  let session = $derived(passedSession || store.sessions.active);
</script>

{#if session}
  <div class="bg-base-100/5 flex-1 flex flex-col">
    {#if session.revision.checklist}
      <Checklist
        respondent={session.respondentId}
        survey={session.revision.checklist}
      />
    {/if}
  </div>
{/if}
