<script lang="ts">
  import { actions } from "astro:actions";
  import clients from "@/stores/clients.svelte";
  import messages from "@/stores/messages.svelte";
  import { preventDefault } from "@/utilities/events";
  import QuestionList from "@/components/surveys/question-list.svelte";
  import surveysAndChecklists from "@/stores/surveysAndChecklists.svelte";

  let loading = $state(false);
  let includeSurveys = $state(true);
  let includeChecklists = $state(true);
  let client = $state<string | null>(null);
  let showNewDialog: Boolean = $state(false);
  let newDialog: HTMLDialogElement | null = $state(null);

  let newChecklist: {
    clientId: string | null;
    systemId: string | null;
    revisionId: string | null;
  } = $state({
    clientId: null,
    systemId: null,
    revisionId: null,
  });

  let clientSystems = $derived.by(() => {
    if (!newChecklist.clientId) return [];
    return actions.system.getByClientId(newChecklist.clientId);
  });

  let revisions = $derived.by(() => {
    if (!newChecklist.systemId) return [];
    return actions.revision.getBySystemId(newChecklist.systemId);
  });

  $effect(() => {
    if (showNewDialog && newDialog) {
      clients.refresh();
      newDialog.showModal();
    }
  });

  $effect(() => {
    if (window.location.hash) {
      const client = surveysAndChecklists.all.find(
        (c) => c.id === window.location.hash.replace("#", "")
      );
      if (client) surveysAndChecklists.setActive(client);
    }
  });

  $effect(() => {
    if (surveysAndChecklists.active)
      window.history.replaceState({}, "", `#${surveysAndChecklists.active.id}`);
  });

  let filteredSurveysAndChecklists = $derived.by(() => {
    const filteredByClient = client
      ? surveysAndChecklists.all.filter((s) => {
          return (
            s.revisionAsChecklist?.system.client.id === client ||
            s.revisionAsSurvey?.system.client.id === client
          );
        })
      : surveysAndChecklists.all;

    return filteredByClient.filter((s) => {
      return !includeSurveys && s.type !== "CHECKLIST"
        ? false
        : !includeChecklists && s.type === "CHECKLIST"
          ? false
          : true;
    });
  });

  async function createSurvey() {
    newDialog?.close();
    if (!newChecklist.revisionId) return;

    await actions.surveys
      .create(newChecklist.revisionId)
      .catch((err) => messages.error(err.message, err.detail));

    await surveysAndChecklists.refreshAll();
  }
</script>

<div
  class="min-w-80 max-w-md w-1/3 bg-neutral flex flex-col border-neutral-200 border-r sticky top-0"
>
  <h2
    class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
  >
    <span>Surveys and Checklists</span>
    <button
      onclick="{() => (showNewDialog = true)}"
      class="btn btn-sm btn-ghost"
    >
      <iconify-icon class="text-xl" icon="ic:baseline-plus"></iconify-icon>
    </button>
  </h2>
  <form class="p-3 flex-none border-neutral-200 border-b">
    <span class="block mb-2 font-semibold">Filters</span>
    <div class="flex items-center gap-3">
      <label class="form-control flex-1">
        <select
          bind:value="{client}"
          class="select select-bordered bg-neutral select-sm"
        >
          <option value="{null}">Client...</option>
          {#each clients.all as client}
            <option value="{client.id}">{client.name}</option>
          {/each}
        </select>
      </label>
      <div class="join">
        <input
          type="checkbox"
          aria-label="Checklists"
          bind:checked="{includeChecklists}"
          class="join-item btn btn-sm btn-neutral border border-neutral-300"
        />
        <input
          type="checkbox"
          aria-label="Surveys"
          bind:checked="{includeSurveys}"
          class="join-item btn btn-sm btn-neutral border border-neutral-300"
        />
      </div>
    </div>
  </form>
  <div
    class:skeleton="{loading}"
    class="bg-neutral rounded-none flex-1 overflow-auto"
  >
    {#if !loading}
      {#each filteredSurveysAndChecklists as survey}
        {@const revision =
          survey.type === "CHECKLIST"
            ? survey.revisionAsChecklist
            : survey.revisionAsSurvey}
        <a
          href="{`#${survey.id}`}"
          data-tip="{'You have unsaved changes to the current checklist or survey!'}"
          class:tooltip="{surveysAndChecklists.activeDirty}"
          class:highlight="{surveysAndChecklists.active?.id === survey.id}"
          onclick="{preventDefault(() =>
            surveysAndChecklists.setActive(survey)
          )}"
          class="btn btn-primary btn-lg btn-outline rounded-none w-full tooltip-error tooltip-top first:tooltip-bottom tooltip-b text-left border-neutral-200 border-t-0 border-r-0 border-l-0 !h-auto px-4 py-4"
        >
          <div class="flex flex-1 items-center justify-start gap-4">
            <div class="flex-none flex justify-center">
              {#if survey.type === "CHECKLIST"}
                <iconify-icon
                  class="text-neutral-400"
                  icon="ic:baseline-checklist"
                ></iconify-icon>
              {:else}
                <iconify-icon class="text-neutral-400" icon="ri:survey-line"
                ></iconify-icon>
              {/if}
            </div>
            <div class="flex flex-col gap-2 flex-1">
              <div class="flex items-center gap-2">
                <span class="badge badge-primary"
                  >{revision?.system.client.name}</span
                >
                <span class="badge badge-secondary"
                  >{revision?.system.title}</span
                >
              </div>
              <strong class="font-semibold"
                >{survey.type === "CHECKLIST" ? "Checklist" : "Survey"} for {revision?.title}</strong
              >
              <small class="text-xs text-neutral-400">{survey.type}</small>
            </div>
          </div>
        </a>
      {/each}
    {/if}
  </div>
</div>

<div class="p-4 w-full flex flex-col gap-4 items-center">
  {#if surveysAndChecklists.active}
    <QuestionList editable="{true}" />
  {/if}
</div>

<dialog
  class="modal"
  bind:this="{newDialog}"
  on:close="{() => (showNewDialog = false)}"
>
  <div class="modal-box bg-neutral">
    <h3 class="font-bold text-lg flex items-center justify-between gap-3">
      Create a new checklist
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost mb-3">✕</button>
      </form>
    </h3>
    <form
      onsubmit="{preventDefault(createSurvey)}"
      class="p-3 flex-none border-neutral-200 border-t flex flex-col gap-4"
    >
      <label class="form-control w-full">
        <div class="label">
          <span class="label-text">Client</span>
        </div>
        <select
          required
          bind:value="{newChecklist.clientId}"
          class="select select-bordered bg-base-100/10"
        >
          <option disabled selected value="{null}">Pick one...</option>
          {#each clients.all as client}
            <option value="{client.id}">{client.name}</option>
          {/each}
        </select>
      </label>
      <label class="form-control w-full">
        <div class="label">
          <span class="label-text">System</span>
        </div>
        <select
          required
          disabled="{!newChecklist.clientId}"
          bind:value="{newChecklist.systemId}"
          class="select select-bordered bg-base-100/10 disabled:bg-base-100/25"
        >
          <option disabled selected value="{null}">Pick one...</option>
          {#await clientSystems then systems}
            {#each systems as system}
              <option value="{system.id}">{system.title}</option>
            {/each}
          {/await}
        </select>
      </label>
      <label class="form-control w-full">
        <div class="label">
          <span class="label-text">Revision</span>
        </div>
        <select
          required
          disabled="{!newChecklist.systemId}"
          bind:value="{newChecklist.revisionId}"
          class="select select-bordered bg-base-100/10 disabled:bg-base-100/25"
        >
          <option disabled selected value="{null}">Pick one...</option>
          {#await revisions then revision}
            {#each revision as system}
              <option value="{system.id}">{system.title}</option>
            {/each}
          {/await}
        </select>
      </label>
      <div class="modal-action">
        <button class="btn btn-ghost">Cancel</button>
        <button disabled="{!newChecklist.revisionId}" class="btn btn-primary"
          >Create Checklist</button
        >
      </div>
    </form>
  </div>
</dialog>

<style lang="postcss">
  .highlight {
    @apply bg-secondary/30 border-l-4 border-l-secondary;
  }
</style>
