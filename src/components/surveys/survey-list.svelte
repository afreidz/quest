<script lang="ts">
  import clients from "@/stores/clients.svelte";
  import { preventDefault } from "@/utilities/events";
  import QuestionList from "@/components/surveys/question-list.svelte";
  import surveysAndChecklists from "@/stores/surveysAndChecklists.svelte";

  let loading = $state(false);
  let includeSurveys = $state(true);
  let includeChecklists = $state(true);
  let client = $state<string | null>(null);

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
</script>

<div
  class="min-w-80 max-w-md w-1/3 bg-neutral flex flex-col border-neutral-200 border-r sticky top-0"
>
  <h2
    class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
  >
    <span>Surveys and Checklists</span>
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

<div class="p-4 w-full flex flex-col gap-4">
  {#if surveysAndChecklists.active}
    <QuestionList editable="{true}" />
  {/if}
</div>

<style lang="postcss">
  .highlight {
    @apply bg-secondary/30 border-l-4 border-l-secondary;
  }
</style>
