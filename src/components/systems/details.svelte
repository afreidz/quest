<script lang="ts">
  import { actions } from "astro:actions";
  import revisions from "@/stores/revisions.svelte";
  import Gauge from "@/components/app/gauge.svelte";
  import type { SystemFromAll } from "@/actions/systems";
  import { calculateAverageSUSScore } from "@/utilities/score";
  import RevisionList from "@/components/systems/revision-list.svelte";
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
  {@const benchmark = 50}
  <RevisionList {system} />
  <div class="flex-1 p-4">
    {#if revisions.active.length === 1}
      {@const average = calculateAverageSUSScore(
        revisions.active[0].respondents,
        revisions.active[0].surveyId
      )}
      <Gauge scores={[[benchmark, average], [benchmark]]} />
    {:else if revisions.active.length > 1}
      {@const score1 = calculateAverageSUSScore(
        revisions.active[1].respondents,
        revisions.active[1].surveyId
      )}
      {@const score2 = calculateAverageSUSScore(
        revisions.active[0].respondents,
        revisions.active[0].surveyId
      )}
      <Gauge scores={[[score1], [score2, score1], [benchmark]]} />
    {/if}
  </div>
  <RespondentList system={systemId} />
{/if}
