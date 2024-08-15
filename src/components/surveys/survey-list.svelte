<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import messages from "@/stores/messages.svelte";
  import Pane from "@/components/app/pane.svelte";
  import type { Systems } from "@/actions/systems";
  import { preventDefault } from "@/utilities/events";
  import type { Revisions } from "@/actions/revisions";
  import Actions from "@/components/app/actions.svelte";
  import type { SurveyFromAll } from "@/actions/surveys";
  import QuestionList from "@/components/surveys/question-list.svelte";

  let loading = $state(true);
  let showNew = $state(false);
  let includeSurveys = $state(true);
  let includeChecklists = $state(true);
  let client = $state<string | null>(null);

  onMount(async () => {
    await store.refreshAllClients();
    await store.refreshAllSurveys();
    const survey = store.surveys.all.find((r) =>
      window.location.hash.includes(r.id),
    );
    store.setActiveSurvey(survey || store.surveys.all[0]);
    window.location.hash = "";
    loading = false;
  });

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
    if (!newChecklist.clientId)
      return { data: [] as Systems, error: undefined };
    return actions.system.getByClientId(newChecklist.clientId);
  });

  let revisions = $derived.by(() => {
    if (!newChecklist.systemId)
      return { data: [] as Revisions, error: undefined };
    return actions.revision.getBySystemId(newChecklist.systemId);
  });

  $effect(() => {
    if (showNew) store.refreshAllClients();
  });

  function navigateToSurvey(s: typeof store.surveys.active) {
    if (store.surveys.unsaved) return;
    store.setActiveSurvey(s);
    window.history.replaceState(null, "", `#${s?.id}`);
  }

  let filteredSurveysAndChecklists = $derived.by(() => {
    const filteredByClient = client
      ? store.surveys.all.filter((s) => {
          return (
            s.revisionAsChecklist?.system.client.id === client ||
            s.revisionAsSurvey?.system.client.id === client
          );
        })
      : store.surveys.all;

    return filteredByClient.filter((s) => {
      return !includeSurveys && s.type !== "CHECKLIST"
        ? false
        : !includeChecklists && s.type === "CHECKLIST"
          ? false
          : true;
    });
  });

  async function createSurvey() {
    showNew = false;
    if (!newChecklist.revisionId) return;

    loading = true;
    const resp = await actions.surveys
      .create(newChecklist.revisionId)
      .catch((err) => {
        messages.error(err.message, err.detail);
        return null;
      });

    if (!resp || resp?.error || !resp?.data) {
      loading = false;
      return messages.error("Unable to create survey", resp?.error);
    }

    await store.refreshAllSurveys();
    loading = false;

    newChecklist = {
      clientId: null,
      systemId: null,
      revisionId: null,
    };

    if (!resp) return;

    messages.success(
      "Survey/Checklist created.",
      JSON.stringify(resp, null, 2),
    );
    const survey = store.surveys.all.find((s) => s.id === resp.data.id);
    if (survey) store.setActiveSurvey(survey);
  }
</script>

<Pane
  {loading}
  collapsable
  render={renderSurvey}
  actions={surveyActions}
  prelist={filterSurveys}
  title="Surveys and Checklists"
  items={filteredSurveysAndChecklists}
/>

<div class="flex-1 p-4 overflow-auto">
  <section class="flex flex-col m-auto gap-6 w-full max-w-[1000px]">
    <QuestionList editable={true} />
  </section>
</div>

{#snippet renderSurvey(survey: SurveyFromAll)}
  {@const revision =
    survey.type === "CHECKLIST"
      ? survey.revisionAsChecklist
      : survey.revisionAsSurvey}
  <a
    href={`#${survey.id}`}
    data-tip={"You have unsaved changes to the current checklist or survey!"}
    class:tooltip={store.surveys.unsaved}
    class:highlight={store.surveys.active?.id === survey.id}
    onclick={preventDefault(() => navigateToSurvey(survey))}
    class="btn btn-primary btn-lg btn-outline rounded-none w-full tooltip-error tooltip-top first:tooltip-bottom tooltip-b text-left border-neutral-200 border-t-0 border-r-0 border-l-0 !h-auto px-4 py-4"
  >
    <div class="flex flex-1 items-center justify-start gap-4">
      <div class="flex-none flex justify-center">
        {#if survey.type === "CHECKLIST"}
          <iconify-icon class="text-neutral-400" icon="ic:baseline-checklist"
          ></iconify-icon>
        {:else}
          <iconify-icon class="text-neutral-400" icon="ri:survey-line"
          ></iconify-icon>
        {/if}
      </div>
      <div class="flex flex-col gap-2 flex-1">
        <div class="flex items-center gap-2">
          <span class="badge badge-primary">{revision?.system.client.name}</span
          >
          <span class="badge badge-secondary">{revision?.system.title}</span>
        </div>
        <strong class="font-semibold"
          >{survey.type === "CHECKLIST" ? "Checklist" : "Survey"} for {revision?.title}</strong
        >
        <small class="text-xs text-neutral-400">{survey.type}</small>
      </div>
    </div>
  </a>
{/snippet}

{#snippet filterSurveys()}
  <form class="p-3 flex-none border-neutral-200 border-b">
    <span class="block mb-2 font-semibold">Filters</span>
    <div class="flex items-center gap-3">
      <label class="form-control flex-1">
        <select
          bind:value={client}
          class="select select-bordered bg-neutral select-sm"
        >
          <option value={null}>Client...</option>
          {#each store.clients.all as client}
            <option value={client.id}>{client.name}</option>
          {/each}
        </select>
      </label>
      <div class="join">
        <input
          type="checkbox"
          aria-label="Checklists"
          bind:checked={includeChecklists}
          class="join-item btn btn-sm btn-neutral border border-neutral-300"
        />
        <input
          type="checkbox"
          aria-label="Surveys"
          bind:checked={includeSurveys}
          class="join-item btn btn-sm btn-neutral border border-neutral-300"
        />
      </div>
    </div>
  </form>
{/snippet}

{#snippet surveyActions()}
  <Actions
    addTip="Create a new checklist"
    addForm={createChecklistForm}
    bind:addShown={showNew}
  />
{/snippet}

{#snippet createChecklistForm()}
  <form
    onsubmit={preventDefault(createSurvey)}
    class="p-3 flex-none border-neutral-200 border-t flex flex-col gap-4 font-normal"
  >
    <label class="form-control w-full">
      <div class="label">
        <span class="label-text">Client</span>
      </div>
      <select
        required
        bind:value={newChecklist.clientId}
        class="select select-bordered bg-base-100/10"
      >
        <option disabled selected value={null}>Pick one...</option>
        {#each store.clients.all as client}
          <option value={client.id}>{client.name}</option>
        {/each}
      </select>
    </label>
    <label class="form-control w-full">
      <div class="label">
        <span class="label-text">System</span>
      </div>
      <select
        required
        disabled={!newChecklist.clientId}
        bind:value={newChecklist.systemId}
        class="select select-bordered bg-base-100/10 disabled:bg-base-100/25"
      >
        <option disabled selected value={null}>Pick one...</option>
        {#await clientSystems then systems}
          {#if systems.data}
            {#each systems.data as system}
              <option value={system.id}>{system.title}</option>
            {/each}
          {/if}
        {/await}
      </select>
    </label>
    <label class="form-control w-full">
      <div class="label">
        <span class="label-text">Revision</span>
      </div>
      <select
        required
        disabled={!newChecklist.systemId}
        bind:value={newChecklist.revisionId}
        class="select select-bordered bg-base-100/10 disabled:bg-base-100/25"
      >
        <option disabled selected value={null}>Pick one...</option>
        {#await revisions then revision}
          {#if revision.data}
            {#each revision.data as system}
              <option value={system.id}>{system.title}</option>
            {/each}
          {/if}
        {/await}
      </select>
    </label>
    <div class="modal-action">
      <button class="btn btn-ghost">Cancel</button>
      <button disabled={!newChecklist.revisionId} class="btn btn-primary"
        >Create Checklist</button
      >
    </div>
  </form>
{/snippet}
