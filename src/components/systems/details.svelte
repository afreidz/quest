<script lang="ts">
  import { actions } from "astro:actions";
  import revisions from "@/stores/revisions.svelte";
  import type { SystemFromAll } from "@/actions/systems";
  import Scores from "@/components/systems/scores.svelte";
  import RevisionList from "@/components/systems/revision-list.svelte";
  import QuestionList from "@/components/surveys/question-list.svelte";
  import RespondentList from "@/components/systems/respondent-list.svelte";

  let system: SystemFromAll | null = $state(null);
  let { systemId }: { systemId: string } = $props();

  $effect(() => {
    if (systemId && !system) {
      actions.system.getById(systemId).then((s) => (system = s));
    }
  });

  export { systemId };
</script>

{#if system}
  <RevisionList {system} />
  <div class="flex-1 p-4 flex flex-col items-center gap-6 overflow-auto">
    {#if revisions.active && revisions.active.survey}
      <QuestionList hideType="{true}" survey="{revisions.active.survey}" />
    {/if}
  </div>
  <div class="bg-neutral flex flex-col max-w-md border-l w-full flex-1">
    <Scores {system} />
    <RespondentList system="{systemId}" />
  </div>
{/if}
