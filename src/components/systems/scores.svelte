<script lang="ts">
  import revisions from "@/stores/revisions.svelte";
  import Gauge from "@/components/app/gauge.svelte";
  import type { SystemFromAll } from "@/actions/systems";
  import CardHeader from "@/components/app/card-header.svelte";
  import { calculateAverageSUSScore } from "@/utilities/score";
  import type { Props as GaugeProps } from "@/components/app/gauge.svelte";
  import type { RevisionFromAll } from "@/actions/revisions";

  type Props = {
    system: SystemFromAll;
  }

  const { system }: Props = $props();
  let compareBenchmark: boolean = $state(true);
  let compareRevision: RevisionFromAll | null = $state(null);

  const average: number | null = $derived.by(() => {
    if (!revisions.active || !revisions.active.surveyId) return null;
    return calculateAverageSUSScore(revisions.active.respondents, revisions.active.surveyId);
  });

  const score: GaugeProps["score"] | undefined = $derived.by(() => {
    if (!average || !revisions.active) return undefined;
    return {
      value: average ?? 0,
      key: revisions.active.title ?? "",
    }
  });

  const comparison: GaugeProps["comparison"] = $derived.by(() => {
    if (!compareRevision) return undefined;
    const value = calculateAverageSUSScore(compareRevision.respondents, compareRevision.surveyId) ?? 0;
    return {
      value,
      key: compareRevision.title,
    }
  });

  const availableComparisonRevisions = $derived.by(() => {
    return revisions.all?.filter((r) => r.id !== revisions.active?.id) ?? [];
  });

  $effect(() => {
    if (system.id && revisions.all === null) revisions.refresh(system.id);
  });

</script>

{#snippet nullResult(text)}
 <span class="uppercase font-semibold opacity-40 py-40 text-center">{text}</span>
{/snippet}

<CardHeader icon="mdi:speedometer" class="mb-4 flex-none">
  <span>Score for { compareRevision ? "multiple revisions" : revisions.active?.title }</span>
</CardHeader>
<div class="p-4">
  {#if revisions.active && score}
    <Gauge
      {score}
      {comparison}
      benchmark={compareBenchmark}
    />
    {:else}
    {@render nullResult(`No score available for this revision`)}
  {/if}
  <div class="flex flex-col gap-4 rounded bg-base-100/15 p-3 my-6 shadow-md">
    <strong>Customize Score:</strong>
    <div class="form-control">
      <label class="label cursor-pointer">
        <span class="label-text">Include Benchmark</span>
        <input type="checkbox" bind:checked={compareBenchmark} class="toggle toggle-primary [--tglbg:#ffffff]" />
      </label>
    </div>
    <label class="form-control !flex-row">
      <span class="label-text flex-1">Compare to revision</span>
      <select bind:value={compareRevision} class="select select-bordered select-primary select-sm bg-neutral flex-1">
        <option value={null}>None</option>
        {#each availableComparisonRevisions as revision}
          <option value={revision}>{revision.title}</option>
        {/each}
      </select>
    </label>
  </div>
</div>
