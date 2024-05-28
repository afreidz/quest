<script lang="ts">
  import { actions } from "astro:actions";
  import clients from "@/stores/clients.svelte";
  import SystemsList from "@/components/clients/systems-list.svelte";

  let newName = $state("");
  let loading = $state(true);
  let search: HTMLInputElement;
  let searchString = $state("");
  let newDialog: HTMLDialogElement;
  let showNewDialog = $state(false);

  let filteredClients = $derived.by(() => {
    if (searchString.length && clients.all.length) {
      return clients.all.filter((c) =>
        c.name.toLowerCase().includes(searchString.toLowerCase())
      );
    } else {
      return clients.all;
    }
  });

  $effect(() => {
    if (window.location.hash) {
      console.log(window.location.hash);
      const client = clients.all.find(
        (c) => c.id === window.location.hash.replace("#", "")
      );
      if (client) clients.setActive(client);
    }
  });

  $effect(() => {
    if (clients.active)
      window.history.replaceState({}, "", `#${clients.active.id}`);
  });

  $effect(() => {
    if (showNewDialog && newDialog) {
      newDialog.showModal();
    }
  });

  $effect(() => {
    if (search) search.focus();
    loading = false;
  });

  async function createNewClient() {
    loading = true;

    await actions.client.create({ name: newName });
    await clients.refresh();

    showNewDialog = false;
    searchString = "";
    newDialog.close();
    loading = false;
    newName = "";
  }
</script>

<div
  class="min-w-80 max-w-md w-1/3 bg-neutral flex flex-col border-neutral-200 border-r"
>
  <h2
    class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
  >
    <span>Clients</span>
    <div
      class="tooltip tooltip-bottom tooltip-primary"
      data-tip="Add a new client"
    >
      <button
        on:click={() => (showNewDialog = true)}
        class="btn btn-sm btn-ghost"
      >
        <iconify-icon class="text-xl" icon="ic:baseline-plus"></iconify-icon>
      </button>
    </div>
  </h2>
  <form class="p-3 flex-none border-neutral-200 border-b">
    <label class="input input-bordered bg-base-100/10 flex items-center gap-2">
      <input
        type="text"
        class="grow"
        bind:this={search}
        placeholder="Search"
        bind:value={searchString}
      />
      <iconify-icon class="text-xl" icon="material-symbols:search"
      ></iconify-icon>
    </label>
  </form>
  <div
    class:skeleton={loading}
    class="bg-neutral rounded-none flex-1 overflow-auto"
  >
    {#if !loading}
      {#each filteredClients as client}
        <a
          href={`#${client.id}`}
          class:highlight={clients.active?.id === client.id}
          on:click|preventDefault={() => clients.setActive(client)}
          class="btn btn-primary btn-lg btn-outline rounded-none w-full text-left border-neutral-200 border-t-0 border-r-0 border-l-0 flex"
        >
          <span class="flex-1">{client.name}</span>
          <div class="badge badge-secondary">
            {client._count.systems} system{client._count.systems !== 1
              ? "s"
              : ""}
          </div>
        </a>
      {/each}
    {/if}
  </div>
</div>

{#if clients.active}
  <SystemsList client={clients.active} />
{/if}

<dialog
  class="modal"
  bind:this={newDialog}
  on:close={() => (showNewDialog = false)}
>
  <div class="modal-box bg-neutral">
    <h3 class="font-bold text-lg flex items-center justify-between gap-3">
      Add a New Client
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost mb-3">✕</button>
      </form>
    </h3>
    <form
      on:submit|preventDefault={createNewClient}
      class="p-3 flex-none border-neutral-200 border-t flex"
    >
      <label class="join overflow-clip input-bordered border flex-1">
        <input
          required
          placeholder="Client name"
          bind:value={newName}
          class="input join-item flex-1 bg-base-100/10"
        />
        <button
          type="submit"
          class="join-item btn btn-primary !rounded-none shadow-none flex-none"
          >Add Client</button
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
