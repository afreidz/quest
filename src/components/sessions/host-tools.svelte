<script lang="ts">
  import CardHeader from "@/components/app/card-header.svelte";
  import Checklist from "@/components/sessions/checklist.svelte";
  import type { SessionById, SessionFromAll } from "@/actions/sessions";

  type Props = {
    session: SessionFromAll | SessionById;
  };

  let { session }: Props = $props();
</script>

<div class="bg-base-100/5 flex-1 flex flex-col">
  {#if session.revision.checklist}
    <CardHeader class="bg-neutral">Session Checklist</CardHeader>
    <Checklist
      respondent={session.respondentId}
      survey={session.revision.checklist}
    />
  {/if}
</div>
