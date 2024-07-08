<script lang="ts">
  import { actions } from "astro:actions";
  import { preventDefault } from "@/utilities/events";
  import type { SystemFromAll } from "@/actions/systems";
  import Avatar from "@/components/respondents/avatar.svelte";

  type Props = {
    system: string;
  };

  let newEmail = $state("");
  let loading = $state(true);
  let suggestionText = $state("");
  let newDialog: HTMLDialogElement;
  let showNewDialog = $state(false);
  let system = $state<SystemFromAll | null>(null);
  let suggestions = $state<SystemFromAll["respondents"]>([]);

  $effect(() => {
    if (newDialog && showNewDialog) newDialog.showModal();
  });

  $effect(() => {
    if (!system && systemId) refreshSystem();
  });

  $effect(() => {
    if (newEmail) {
      suggestionText = "Or select an existing respondent from the list";
      actions.respondents.getBySearch(newEmail).then((r) => (suggestions = r));
    } else if (system?.respondents.length) {
      suggestions = system.respondents;
      suggestionText = "Toggle existing respondents";
    } else {
      suggestions = [];
    }
  });

  async function refreshSystem() {
    loading = true;
    system = await actions.system.getById(systemId);
    loading = false;
  }

  async function toggleExisting(add: boolean, r: (typeof suggestions)[number]) {
    if (add) {
      await actions.respondents.addToSystems({
        id: r.id,
        systemIds: [systemId],
      });
    } else {
      await actions.respondents.removeFromSystems({
        id: r.id,
        systemIds: [systemId],
      });
    }
    await refreshSystem();
  }

  async function createNewRespondent() {
    loading = true;

    await actions.respondents.create({
      systemId,
      email: newEmail,
    });

    await refreshSystem();

    showNewDialog = false;
    newDialog.close();
    loading = false;
    newEmail = "";
  }

  let { system: systemId }: Props = $props();
</script>

<div class="min-w-80 bg-neutral flex flex-col border-neutral-200 border-t">
  <h2
    class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
  >
    <span>Respondents</span>
    <div
      class="tooltip tooltip-left tooltip-primary"
      data-tip="Add or remove a respondent for {system?.title}"
    >
      <button
        class="btn btn-sm btn-ghost"
        on:click="{() => (showNewDialog = true)}"
      >
        <iconify-icon class="text-xl" icon="mdi:plus-minus-variant"
        ></iconify-icon>
      </button>
    </div>
  </h2>
  <div
    class:skeleton="{loading}"
    class="bg-neutral rounded-none flex-1 overflow-auto"
  >
    {#if !loading && !!system}
      {#each system.respondents as respondent}
        <a
          href="{`/respondents/${respondent.id}`}"
          class="btn bg-neutral btn-primary btn-lg btn-outline rounded-none w-full text-left border-neutral-200 border-r-0 border-l-0 border-t-0 flex items-center"
        >
          <Avatar {respondent} />
          <span class="flex-1">{respondent.email}</span>
        </a>
      {/each}
    {/if}
  </div>
</div>

<dialog
  class="modal"
  bind:this="{newDialog}"
  on:close="{() => (showNewDialog = false)}"
>
  <div class="modal-box bg-neutral">
    <h3 class="font-bold text-lg flex items-center justify-between gap-3">
      Manage respondents for {system?.title}
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost mb-3">
          <iconify-icon class="text-xl" icon="mdi:close"></iconify-icon>
        </button>
      </form>
    </h3>
    <form
      onsubmit="{preventDefault(createNewRespondent)}"
      class="p-3 flex-none border-neutral-200 border-t flex"
    >
      <label class="join overflow-clip input-bordered border flex-1">
        <input
          required
          type="email"
          bind:value="{newEmail}"
          placeholder="Respondent email"
          class="input join-item flex-1 bg-base-100/10"
        />
        <button
          type="submit"
          class="join-item btn btn-primary !rounded-none shadow-none flex-none"
          >Add Respondent</button
        >
      </label>
    </form>
    {#if suggestions.length}
      <div class="text-center mb-2 text-sm">
        {suggestionText}
      </div>
      <ul class="mx-3">
        {#each suggestions as suggestion}
          {@const existing = system?.respondents.some(
            (r) => r.id === suggestion.id
          )}
          <li class="form-control bg-base-100/10 mb-1 p-2 rounded">
            <label class="label cursor-pointer">
              <span class="label-text"
                >{suggestion.name ?? suggestion.email}</span
              >
              <input
                type="checkbox"
                checked="{existing}"
                class="checkbox checkbox-primary"
                onchange="{preventDefault(() =>
                  toggleExisting(!existing, suggestion)
                )}"
              />
            </label>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</dialog>
