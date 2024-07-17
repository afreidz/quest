<script lang="ts">
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import messages from "@/stores/messages.svelte";
  import { preventDefault } from "@/utilities/events";
  import Actions from "@/components/app/actions.svelte";
  import ConfirmForm from "@/components/app/confirm-form.svelte";

  let loading = $state(false);

  let newName = $state("");
  let showNew = $state(false);

  let editedName = $state("");
  let showEdit = $state(false);

  let showConfirmDelete = $state(false);

  $effect(() => {
    if (store.clients.active?.name && !editedName) {
      editedName = store.clients.active.name;
    }
  });

  $effect(() => {
    if (!store.clients.active) return;
    loading = true;
    store.refreshAllSystems().then(() => (loading = false));
  });

  async function deleteClient(returnValue?: string) {
    showConfirmDelete = false;

    if (!returnValue || returnValue !== store.clients.active?.name) return;
    if (!store.clients.active) return;

    loading = true;
    const resp = await actions.client
      .deleteById(store.clients.active.id)
      .catch((err) => {
        messages.error(err.message, err.detail);
      });
    loading = false;
    store.setActiveClient(null);

    if (!resp) return;

    await store.refreshAllClients();
    messages.success(`Client deleted.`, JSON.stringify(resp, null, 2));
  }

  async function updateClient() {
    showEdit = false;
    if (!store.clients.active) return;

    loading = true;
    const resp = await actions.client
      .updateById({
        id: store.clients.active.id,
        data: {
          ...store.clients.active,
          name: editedName,
        },
      })
      .catch((err) => {
        messages.error(err.message, err.detail);
      });

    loading = false;
    editedName = store.clients.active.name;

    if (!resp) return;

    await store.refreshAllClients();
    messages.success(`Client updated`, JSON.stringify(resp, null, 2));
  }

  async function createNewSystem() {
    showNew = false;
    if (!store.clients.active?.id) return;

    loading = true;
    const resp = await actions.system
      .create({
        clientId: store.clients.active.id,
        title: newName,
      })
      .catch((err) => {
        messages.error(err.message, err.detail);
      });
    loading = false;
    newName = "";

    if (!resp) return;

    await store.refreshAllSystems();
    messages.success(`System added`, JSON.stringify(resp, null, 2));
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
      <Actions
        addTip="Add system to client"
        editTip="Edit client name"
        deleteTip="Delete client"
        deleteForm={deleteClientForm}
        editForm={editClientForm}
        addForm={addSystemForm}
        bind:addShown={showNew}
        bind:editShown={showEdit}
        bind:deleteShown={showConfirmDelete}
      />
    </h2>
    <div
      class:skeleton={loading}
      class="bg-base-100/20 rounded-none flex-1 overflow-auto flex flex-col justify-center"
    >
      {#if !loading}
        {#each store.systems.all as system}
          <a
            href={`/clients/${store.clients.active.id}/systems/${system.id}`}
            class="btn bg-neutral btn-primary btn-lg btn-outline rounded-none w-full text-left border-neutral-200 border-r-0 border-l-0 [&:not(:first-child)]:border-t-0 flex"
          >
            <span class="flex-1">{system.title}</span>
            <div class="badge badge-secondary">
              {system.revisions.length} revision{system.revisions.length !== 1
                ? "s"
                : ""}
            </div>
          </a>
        {/each}
      {/if}
    </div>
  </div>
{/if}

{#snippet addSystemForm()}
  <form
    onsubmit={preventDefault(createNewSystem)}
    class="p-3 flex-none border-neutral-200 border-t flex"
  >
    <label class="join overflow-clip input-bordered border flex-1">
      <input
        required
        bind:value={newName}
        class="input join-item flex-1 bg-base-100/10 font-normal"
        placeholder="{store.clients.active?.name} system name"
      />
      <button
        type="submit"
        class="join-item btn btn-primary !rounded-none shadow-none flex-none"
        >Add System</button
      >
    </label>
  </form>
{/snippet}

{#snippet editClientForm()}
  <form
    onsubmit={preventDefault(updateClient)}
    class="p-3 flex-none border-neutral-200 border-t flex"
  >
    <label class="join overflow-clip input-bordered border flex-1">
      <input
        required
        bind:value={editedName}
        placeholder={store.clients.active?.name}
        class="input font-normal join-item flex-1 bg-base-100/10"
      />
      <button
        type="submit"
        class="join-item btn btn-primary !rounded-none shadow-none flex-none"
        >Update</button
      >
    </label>
  </form>
{/snippet}

{#snippet deleteClientForm()}
  <ConfirmForm confirmText={store.clients.active?.name} onsubmit={deleteClient}>
    Are you sure you want to delete this client? You will lose all systems and
    scores associated with it. This is not reversible!
  </ConfirmForm>
{/snippet}
