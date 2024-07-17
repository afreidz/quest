<script lang="ts">
  import store from "@/stores/global.svelte";
  import Gauge from "@/components/app/gauge.svelte";
  import CardHeader from "@/components/app/card-header.svelte";
  import { calculateAverageSUSScore } from "@/utilities/score";
  import type { Props as GaugeProps } from "@/components/app/gauge.svelte";

  const average: number | null = $derived.by(() => {
    if (!store.revisions.active?.survey?.id) return null;

    return calculateAverageSUSScore(
      store.revisions.active.respondents,
      store.revisions.active.survey,
    );
  });

  const score: GaugeProps["score"] | undefined = $derived.by(() => {
    if (!average || !store.revisions.active) return undefined;
    return {
      value: average ?? 0,
      key: store.revisions.active.title ?? "",
    };
  });

  const comparison: GaugeProps["comparison"] = $derived.by(() => {
    if (!store.revisions.compared) return undefined;
    const value =
      calculateAverageSUSScore(
        store.revisions.compared.respondents,
        store.revisions.compared.survey,
      ) ?? 0;
    return {
      value,
      key: store.revisions.compared.title,
    };
  });
</script>

{#snippet nullResult(text)}
  <div class="flex-1 size-full flex items-center justify-center">
    <span class="uppercase font-semibold opacity-40 py-40 text-center"
      >{text}</span
    >
  </div>
{/snippet}

<div class="flex-1 group">
  <CardHeader icon="mdi:speedometer" class="border-t group-first:border-t-0">
    <span>SUS Score</span>
  </CardHeader>
  <div class="p-4">
    {#if store.revisions.active && score}
      <Gauge
        {score}
        {comparison}
        benchmark={store.revisions.includeBenchmark}
      />
    {:else}
      {@render nullResult(`No survey responses for this revision`)}
    {/if}
  </div>
</div>
