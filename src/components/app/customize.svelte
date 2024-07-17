<script lang="ts">
  import store from "@/stores/global.svelte";
  import type { RevisionFromAll } from "@/actions/revisions";

  let compareBenchmark: boolean = $state(true);
  let compareRevision: RevisionFromAll | null = $state(null);

  $effect(() => store.setComparedRevision(compareRevision));
  $effect(() => store.setIncludeBenchmarkInRevision(compareBenchmark));
</script>

<div class="flex flex-col gap-4 rounded bg-base-100/15 p-3 my-6 shadow-md">
  <strong>Customize Score:</strong>
  <div class="form-control">
    <label class="label cursor-pointer">
      <span class="label-text">Include Benchmark in SUS score</span>
      <input
        type="checkbox"
        bind:checked="{compareBenchmark}"
        class="toggle toggle-primary [--tglbg:#ffffff]"
      />
    </label>
  </div>
  <label class="form-control !flex-row">
    <span class="label-text flex-1">Compare to revision</span>
    <select
      bind:value="{compareRevision}"
      class="select select-bordered select-primary select-sm bg-neutral flex-1"
    >
      <option value="{null}">None</option>
      {#each store.revisions.all as revision}
        {#if revision.id !== store.revisions.active?.id}
          <option value="{revision}">{revision.title}</option>
        {/if}
      {/each}
    </select>
  </label>
</div>
