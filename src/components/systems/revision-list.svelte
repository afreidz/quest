<script lang="ts">
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import { SurveyType } from "@hsalux/quest-db";
  import messages from "@/stores/messages.svelte";
  import { preventDefault } from "@/utilities/events";
  import ConfirmDialog from "@/components/app/confirm-dialog.svelte";

  let newName = $state("");
  let loading = $state(false);
  let showNewDialog = $state(false);
  let newDialog: HTMLDialogElement | null = $state(null);
  let newSurveyInput: HTMLSelectElement | null = $state(null);
  let surveyType = $state<keyof typeof SurveyType | undefined>();

  let updatedTitle = $state("");
  let showEditDialog = $state(false);
  let editInput: HTMLInputElement | null = $state(null);
  let editDialog: HTMLDialogElement | null = $state(null);

  let showConfirmDelete = $state(false);
  let confirmDeleteDialog: HTMLDialogElement | null = $state(null);

  $effect(() => {
    if (showNewDialog && newDialog) newDialog.showModal();
  });

  $effect(() => {
    if (showNewDialog && newSurveyInput) newSurveyInput.focus();
  });

  $effect(() => {
    if (!store.revisions.all.length) return;
    const revision = store.revisions.all.find((r) =>
      window.location.hash.includes(r.id)
    );
    store.setActiveRevision(revision || store.revisions.all[0]);
    window.location.hash = "";
  });

  $effect(() => {
    if (store.systems.active?.title && !updatedTitle)
      updatedTitle = store.systems.active.title;
  });

  $effect(() => {
    if (editDialog && showEditDialog) editDialog.showModal();
  });

  $effect(() => {
    if (showEditDialog && editInput) editInput.focus();
  });

  async function handleDeleteSystem() {
    showConfirmDelete = false;

    if (confirmDeleteDialog?.returnValue !== store.systems.active?.title)
      return;
    if (!store.systems.active) return;

    await actions.system.deleteById(store.systems.active.id);
    window.history.back();
  }

  async function updateSystem() {
    editDialog?.close();
    if (!store.systems.active) return;

    const resp = await actions.system.updateById({
      id: store.systems.active.id,
      data: {
        ...store.systems.active,
        title: updatedTitle,
      },
    });

    await store.refreshActiveSystem();
    console.log(store.systems.active);
    messages.success(`Client updated`, JSON.stringify(resp, null, 2));
  }

  function navigateToRevision(r: typeof store.revisions.active) {
    if (store.revisions.unsaved) return;
    store.setActiveRevision(r);
    window.history.replaceState(null, "", `#${r?.id}`);
  }

  async function createNewRevision() {
    if (!store.systems.active) return;

    loading = true;

    await actions.revision.create({
      surveyType,
      title: newName,
      systemId: store.systems.active.id,
    });

    await store.refreshAllRevisions();

    showNewDialog = false;
    newDialog?.close();
    loading = false;
    newName = "";
  }
</script>

{#if store.systems.active}
  <div
    class="min-w-80 max-w-80 bg-neutral flex flex-col border-neutral-200 border-r sticky top-0"
  >
    <h2
      class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
    >
      <span>{store.systems.active.title} Revisions</span>
      <div
        class="tooltip tooltip-left tooltip-primary"
        data-tip="Add a revision for {store.systems.active.title}"
      >
        <button
          on:click="{() => (showNewDialog = true)}"
          class="btn btn-sm btn-ghost"
        >
          <iconify-icon class="text-xl" icon="ic:baseline-plus"></iconify-icon>
        </button>
      </div>
    </h2>
    <div
      class:skeleton="{loading}"
      class="bg-neutral rounded-none flex-1 overflow-auto"
    >
      {#if !loading}
        {#if !store.revisions.all.length}
          <strong class="block uppercase font-semibold opacity-40 p-4 text-sm"
            >No revisions for this system. Please create one above</strong
          >
        {:else}
          {#each store.revisions.all ?? [] as revision}
            <div
              class:highlight="{store.revisions.active?.id === revision.id}"
              class="btn btn-primary btn-lg btn-outline rounded-none w-full text-left pl-0 border-neutral-200 border-t-0 border-r-0 border-l-0 flex"
            >
              <a
                href="#{revision.id}"
                class:tooltip="{store.revisions.unsaved}"
                on:click="{preventDefault(() => navigateToRevision(revision))}"
                data-tip="{'You have unsaved changes to the current revision!'}"
                class="flex-1 h-full flex items-center pl-4">{revision.title}</a
              >
            </div>
          {/each}
        {/if}
      {/if}
    </div>
    <footer class="bg-neutral p-4 border-t flex items-center justify-between">
      <span class="text-lg font-semibold">Actions:</span>
      <div class="join">
        <button
          data-tip="Edit system title"
          onclick="{() => (showEditDialog = true)}"
          class="btn btn-outline btn-sm join-item tooltip tooltip-left tooltip-primary"
        >
          <iconify-icon icon="mdi:edit-outline" class="pointer-events-none"
          ></iconify-icon>
        </button>
        <button
          data-tip="Delete system"
          onclick="{() => (showConfirmDelete = true)}"
          class="btn btn-outline btn-sm join-item tooltip tooltip-left tooltip-primary"
        >
          <iconify-icon icon="mdi:trash-outline" class="pointer-events-none"
          ></iconify-icon>
        </button>
      </div>
    </footer>
  </div>
{/if}

<dialog
  class="modal"
  bind:this="{newDialog}"
  on:close="{() => (showNewDialog = false)}"
>
  <div class="modal-box bg-neutral">
    <h3 class="font-bold text-lg flex justify-between items-center gap-3">
      New revision for {store.systems.active?.title}
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost mb-3">✕</button>
      </form>
    </h3>
    <form
      on:submit|preventDefault="{createNewRevision}"
      class="p-3 flex-none border-neutral-200 border-t flex flex-col gap-2"
    >
      <select
        bind:value="{surveyType}"
        bind:this="{newSurveyInput}"
        class="select select-bordered bg-base-100/10 w-full"
      >
        <option disabled selected>What type of revision is this?</option>
        {#each Object.keys(SurveyType).filter((k) => !k.includes("CHECKLIST")) as type}
          <option value="{type}"
            >{type.includes("CURRENT")
              ? "Current State Survey Type"
              : "Proposed State Survey Type"}</option
          >
        {/each}
      </select>
      <label class="join overflow-clip input-bordered border flex-1">
        <input
          required
          bind:value="{newName}"
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

<ConfirmDialog
  open="{!!showConfirmDelete}"
  onclose="{handleDeleteSystem}"
  bind:elm="{confirmDeleteDialog}"
  confirmText="{store.systems.active?.title}"
>
  Are you sure you want to delete this system? You will lose all data associated
  with the system and this is not reversible!
  <p>Please type "{store.systems.active?.title}" to confirm</p>
</ConfirmDialog>

<dialog
  class="modal"
  bind:this="{editDialog}"
  on:close="{() => (showEditDialog = false)}"
>
  <div class="modal-box bg-neutral">
    <h3 class="font-bold text-lg flex items-center justify-between gap-3">
      Update system title
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost mb-3">✕</button>
      </form>
    </h3>
    <form
      onsubmit="{preventDefault(updateSystem)}"
      class="p-3 flex-none border-neutral-200 border-t flex"
    >
      <label class="join overflow-clip input-bordered border flex-1">
        <input
          required
          bind:this="{editInput}"
          bind:value="{updatedTitle}"
          placeholder="{store.systems.active?.title}"
          class="input join-item flex-1 bg-base-100/10"
        />
        <button
          type="submit"
          class="join-item btn btn-primary !rounded-none shadow-none flex-none"
          >Update Client Name</button
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
