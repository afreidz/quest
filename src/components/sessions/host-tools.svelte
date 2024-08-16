<script lang="ts">
  import store from "@/stores/global.svelte";
  import Moments from "@/components/sessions/moments.svelte";
  import Checklist from "@/components/sessions/checklist.svelte";
  import type { SessionById, SessionFromAll } from "@/actions/sessions";

  type Props = {
    session?: SessionFromAll | SessionById;
  };

  let { session: passedSession }: Props = $props();
  let session = $derived(passedSession || store.sessions.active);
</script>

{#if session}
  <div class="bg-base-100/5 flex-1 flex flex-col max-h-full">
    {#if session.revision.checklist}
      <Checklist
        respondent={session.respondentId}
        survey={session.revision.checklist}
        class="h-[58%] overflow-auto"
      />
      <Moments {session} class="h-[42%] overflow-auto" />
    {/if}
  </div>
{/if}
