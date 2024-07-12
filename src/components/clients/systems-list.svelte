<script lang="ts">
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import messages from "@/stores/messages.svelte";
  import { preventDefault } from "@/utilities/events";
  import ConfirmDialog from "../app/confirm-dialog.svelte";

  let newName = $state("");
  let loading = $state(false);
  let showNewDialog = $state(false);
  let newDialog: HTMLDialogElement | null = $state(null);
  let newSystemInput: HTMLInputElement | null = $state(null);

  let updatedName = $state("");
  let showEditDialog = $state(false);
  let editInput: HTMLInputElement | null = $state(null);
  let editDialog: HTMLDialogElement | null = $state(null);

  let showConfirmDelete = $state(false);
  let confirmDeleteDialog: HTMLDialogElement | null = $state(null);

  $effect(() => {
    if (showConfirmDelete && confirmDeleteDialog)
      confirmDeleteDialog.showModal();
  });

  $effect(() => {
    if (newDialog && showNewDialog) newDialog.showModal();
  });

  $effect(() => {
    if (editDialog && showEditDialog) editDialog.showModal();
  });

  $effect(() => {
    if (showNewDialog && newSystemInput) newSystemInput.focus();
  });

  $effect(() => {
    if (showEditDialog && editInput) editInput.focus();
  });

  $effect(() => {
    if (!store.clients.active) return;
    loading = true;
    store.refreshAllSystems().then(() => (loading = false));
  });

  $effect(() => {
    if (store.clients.active?.name && !updatedName)
      updatedName = store.clients.active.name;
  });

  async function handleDeleteClient() {
    showConfirmDelete = false;

    if (confirmDeleteDialog?.returnValue !== store.clients.active?.name) return;
    if (!store.clients.active) return;

    const resp = await actions.client.deleteById(store.clients.active.id);
    await store.refreshAllClients();
    store.setActiveClient(null);

    messages.success(`Client deleted.`, JSON.stringify(resp, null, 2));
  }

  async function updateClient() {
    editDialog?.close();
    if (!store.clients.active) return;

    const resp = await actions.client.updateById({
      id: store.clients.active.id,
      data: {
        ...store.clients.active,
        name: updatedName,
      },
    });

    await store.refreshAllClients();
    messages.success(`Client updated`, JSON.stringify(resp, null, 2));
  }

  async function createNewSystem() {
    if (!store.clients.active?.id) return;
    loading = true;

    await actions.system.create({
      clientId: store.clients.active.id,
      title: newName,
    });

    await store.refreshAllSystems();

    showNewDialog = false;
    newDialog?.close();
    loading = false;
    newName = "";
  }
</script>

{#if store.clients.active}
  <div
    class="min-w-80 max-w-md w-1/3 bg-neutral flex flex-col border-neutral-200 border-r"
  >
    <h2
      class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
    >
      <span>{store.clients.active?.name} Systems</span>
      <div
        class="tooltip tooltip-bottom tooltip-primary"
        data-tip="Add a system for {store.clients.active?.name}"
      >
        <button
          class="btn btn-sm btn-ghost"
          on:click="{() => (showNewDialog = true)}"
        >
          <iconify-icon class="text-xl" icon="ic:baseline-plus"></iconify-icon>
        </button>
      </div>
    </h2>
    <div
      class:skeleton="{loading}"
      class="bg-base-100/20 rounded-none flex-1 overflow-auto flex flex-col justify-center"
    >
      {#if !loading}
        {#each store.systems.all as system}
          <a
            href="{`/clients/${store.clients.active.id}/systems/${system.id}`}"
            class="btn bg-neutral btn-primary btn-lg btn-outline rounded-none w-full text-left border-neutral-200 border-r-0 border-l-0 [&:not(:first-child)]:border-t-0 flex"
          >
            <span class="flex-1">{system.title}</span>
            <div class="badge badge-secondary">
              {system._count.revisions} revision{system._count.revisions !== 1
                ? "s"
                : ""}
            </div>
          </a>
        {/each}
      {/if}
    </div>
    <footer class="bg-neutral p-4 border-t flex items-center justify-between">
      <span class="text-lg font-semibold">Actions:</span>
      <div class="join">
        <button
          data-tip="Edit client name"
          onclick="{() => (showEditDialog = true)}"
          class="btn btn-outline btn-sm join-item tooltip tooltip-left tooltip-primary"
        >
          <iconify-icon icon="mdi:edit-outline" class="pointer-events-none"
          ></iconify-icon>
        </button>
        <button
          data-tip="Delete client"
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
    <h3 class="font-bold text-lg flex items-center justify-between gap-3">
      Create a new system for {store.clients.active?.name}
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost mb-3">✕</button>
      </form>
    </h3>
    <form
      onsubmit="{preventDefault(createNewSystem)}"
      class="p-3 flex-none border-neutral-200 border-t flex"
    >
      <label class="join overflow-clip input-bordered border flex-1">
        <input
          required
          bind:value="{newName}"
          bind:this="{newSystemInput}"
          class="input join-item flex-1 bg-base-100/10"
          placeholder="{store.clients.active?.name} system name"
        />
        <button
          type="submit"
          class="join-item btn btn-primary !rounded-none shadow-none flex-none"
          >Add System</button
        >
      </label>
    </form>
  </div>
</dialog>

<ConfirmDialog
  open="{!!showConfirmDelete}"
  onclose="{handleDeleteClient}"
  bind:elm="{confirmDeleteDialog}"
  confirmText="{store.clients.active?.name}"
>
  Are you sure you want to delete this client? You will lose all data associated
  with the client and this is not reversible!
  <p>Please type "{store.clients.active?.name}" to confirm</p>
</ConfirmDialog>

<dialog
  class="modal"
  bind:this="{editDialog}"
  on:close="{() => (showEditDialog = false)}"
>
  <div class="modal-box bg-neutral">
    <h3 class="font-bold text-lg flex items-center justify-between gap-3">
      Update client name
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost mb-3">✕</button>
      </form>
    </h3>
    <form
      onsubmit="{preventDefault(updateClient)}"
      class="p-3 flex-none border-neutral-200 border-t flex"
    >
      <label class="join overflow-clip input-bordered border flex-1">
        <input
          required
          bind:this="{editInput}"
          bind:value="{updatedName}"
          placeholder="{store.clients.active?.name}"
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
