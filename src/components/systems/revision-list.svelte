<script lang="ts">
  import { actions } from "astro:actions";
  import { SurveyType } from "@hsalux/quest-db";
  import revisions from "@/stores/revisions.svelte";
  import { MAX_AGGREGATE } from "@/utilities/numbers";
  import type { SystemFromAll } from "@/actions/systems";

  type Props = {
    system: SystemFromAll;
  };

  let newName = $state("");
  let loading = $state(false);
  let newDialog: HTMLDialogElement;
  let showNewDialog = $state(false);
  let aggregated = $state<typeof revisions.active>([]);
  let surveyType = $state<keyof typeof SurveyType | undefined>();

  $effect(() => {
    if (system.id && !revisions.all.length) revisions.refresh(system.id);
  });

  $effect(() => {
    if (showNewDialog && newDialog) newDialog.showModal();
  });

  $effect(() => {
    revisions.setActive(aggregated);
  });

  async function createNewRevision() {
    loading = true;

    await actions.revision.create({
      surveyType,
      title: newName,
      systemId: system.id,
    });

    await revisions.refresh(system.id);

    showNewDialog = false;
    newDialog.close();
    loading = false;
    newName = "";
  }

  let { system }: Props = $props();
</script>

<div
  class="min-w-80 max-w-80 bg-neutral flex flex-col border-neutral-200 border-r"
>
  <h2
    class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
  >
    <span>{system.title} Revisions</span>
    <div
      class="tooltip tooltip-bottom tooltip-primary"
      data-tip="Add a revision for {system.title}"
    >
      <button
        on:click={() => (showNewDialog = true)}
        class="btn btn-sm btn-ghost"
      >
        <iconify-icon class="text-xl" icon="ic:baseline-plus"></iconify-icon>
      </button>
    </div>
  </h2>
  <div
    class:skeleton={loading}
    class="bg-neutral rounded-none flex-1 overflow-auto"
  >
    {#if !loading}
      {#each revisions.all as revision}
        <div
          class:highlight={revisions.active.includes(revision)}
          class="btn btn-primary btn-lg btn-outline rounded-none w-full text-left pl-0 border-neutral-200 border-t-0 border-r-0 border-l-0 flex"
        >
          <button
            on:click={() => revisions.setActive([revision])}
            class="flex-1 h-full flex items-center pl-4"
            >{revision.title}</button
          >

          {#if revisions.active}
            <div
              class="tooltip tooltip-primary tooltip-left"
              data-tip={revisions.active.length >= MAX_AGGREGATE
                ? `Max ${MAX_AGGREGATE} for aggregated scoring`
                : "Add to aggregate score"}
            >
              <input
                type="checkbox"
                value={revision}
                bind:group={aggregated}
                class="checkbox checkbox-secondary"
                checked={revisions.active.includes(revision)}
                disabled={revisions.active.length >= MAX_AGGREGATE &&
                  !revisions.active.includes(revision)}
              />
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

<dialog
  class="modal"
  bind:this={newDialog}
  on:close={() => (showNewDialog = false)}
>
  <div class="modal-box bg-neutral">
    <h3 class="font-bold text-lg flex justify-between items-center gap-3">
      New revision for {system.title}
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost mb-3">✕</button>
      </form>
    </h3>
    <form
      on:submit|preventDefault={createNewRevision}
      class="p-3 flex-none border-neutral-200 border-t flex flex-col gap-2"
    >
      <select
        bind:value={surveyType}
        class="select select-bordered bg-base-100/10 w-full"
      >
        <option disabled selected>What type of revision is this?</option>
        {#each Object.keys(SurveyType).filter((k) => !k.includes("CHECKLIST")) as type}
          <option value={type}
            >{type.includes("CURRENT")
              ? "Current State Survey Type"
              : "Proposed State Survey Type"}</option
          >
        {/each}
      </select>
      <label class="join overflow-clip input-bordered border flex-1">
        <input
          required
          bind:value={newName}
          placeholder="Revision title"
          class="input join-item flex-1 bg-base-100/10"
        />
        <button
          type="submit"
          class="join-item btn btn-primary !rounded-none shadow-none flex-none"
          >Add revision</button
        >
      </label>
    </form>
  </div>
</dialog>

<style lang="postcss">
  .highlight {
    @apply bg-secondary/30 border-l-4 border-l-secondary;
  }
</style>
