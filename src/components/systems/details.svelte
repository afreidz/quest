<script lang="ts">
  import { actions } from "astro:actions";
  import revisions from "@/stores/revisions.svelte";
  import Gauge from "@/components/app/gauge.svelte";
  import { MAX_AGGREGATE } from "@/utilities/numbers";
  import type { SystemFromAll } from "@/actions/systems";
  import CardHeader from "@/components/app/card-header.svelte";
  import { calculateAverageSUSScore } from "@/utilities/score";
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

{#snippet nullResult(text)}
 <span class="uppercase font-semibold opacity-40 py-40 text-center">{text}</span>
{/snippet}

{#if system}
  {@const benchmark = 50}
  <RevisionList {system} />
  <div class="flex-1 p-4 flex flex-col items-center gap-6">
    <div
      class="card bg-neutral rounded-lg shadow-sm p-4 w-full flex flex-col max-w-3xl"
    >
      <CardHeader icon="mdi:speedometer" class="mb-4 flex-none">
        <span>Score for revision</span>
        <span slot="sub"
          >The raw SUS score based on completed respondents for <strong
            >"{system.title}"</strong
          > compared to the industry SUS benchmark</span
        >
      </CardHeader>
      {#if revisions.active.length === 1}
        {@const average = calculateAverageSUSScore(
          revisions.active[0]?.respondents,
          revisions.active[0]?.surveyId
        )}
        {@const differential = average !== null ? average - benchmark : null}
        {#if differential && average !== null}
          <Gauge
            {differential}
            values={[average, benchmark]}
            scores={[[average, benchmark], [benchmark]]}
            keys={[revisions.active[0].title, "Benchmark"]}
          />
          {:else}
          {@render nullResult(`No score available for this revision`)}
        {/if}
      {:else if revisions.active.length > 1}
      {@const score1 = calculateAverageSUSScore(
        revisions.active[0].respondents,
        revisions.active[0].surveyId
        )}
        {@const score2 = calculateAverageSUSScore(
          revisions.active[1].respondents,
          revisions.active[1].surveyId
        )}
        {@const differential =
          score2 === null || score1 === null ? null : score2 - score1}
        {#if differential && score1 !== null && score2 !== null}
          <Gauge
            {differential}
            values={[score2, score1, benchmark]}
            scores={[[score2, score2], [score2, score1], [benchmark]]}
            keys={[
              revisions.active[1].title,
              revisions.active[0].title,
              "Benchmark",
            ]}
          />
          {:else}
          {@render nullResult(`No score available for 1 or more of the revisions selected`)}
        {/if}
      {:else}
      {@render nullResult(`Select 1 - ${MAX_AGGREGATE} revisions from the list`)}
      {/if}
    </div>
    {#if revisions.active.length === 1 && revisions.active[0].survey}
      <QuestionList hideType={true} survey={revisions.active[0].survey} />
    {/if}
  </div>
  <RespondentList system={systemId} />
{/if}
