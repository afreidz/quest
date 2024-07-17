<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import messages from "@/stores/messages.svelte";
  import { preventDefault } from "@/utilities/events";
  import Actions from "@/components/app/actions.svelte";
  import SystemsList from "@/components/clients/systems-list.svelte";

  let loading = $state(true);

  let newName = $state("");
  let showNewDialog = $state(false);

  let searchString = $state("");
  let search: HTMLInputElement | null = $state(null);

  onMount(async () => {
    await store.refreshAllClients();
    if (!store.clients.active && store.clients.all.length)
      store.setActiveClient(store.clients.all[0]);
  });

  let filteredClients = $derived.by(() => {
    if (searchString.length && store.clients.all.length) {
      return store.clients.all.filter((c) =>
        c.name.toLowerCase().includes(searchString.toLowerCase()),
      );
    } else {
      return store.clients.all;
    }
  });

  $effect(() => {
    if (window.location.hash) {
      const client = store.clients.all.find(
        (c) => c.id === window.location.hash.replace("#", ""),
      );
      if (client) store.setActiveClient(client);
    }
  });

  $effect(() => {
    if (store.clients.active)
      window.history.replaceState({}, "", `#${store.clients.active.id}`);
  });

  $effect(() => {
    if (search) search.focus();
    loading = false;
  });

  async function createNewClient() {
    showNewDialog = false;

    loading = true;
    const resp = await actions.client.create({ name: newName }).catch((err) => {
      messages.error(err.message, err.detail);
    });

    loading = false;
    searchString = "";
    newName = "";

    if (!resp) return;

    await store.refreshAllClients();
    messages.success("Client created", JSON.stringify(resp, null, 2));
  }
</script>

<div
  class="min-w-80 max-w-md w-1/3 bg-neutral flex flex-col border-neutral-200 border-r sticky top-0"
>
  <h2
    class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
  >
    <span>Clients</span>
    <Actions
      addForm={createNewClientForm}
      addTip="Add new client"
      bind:addShown={showNewDialog}
    />
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
          class:highlight={store.clients.active?.id === client.id}
          onclick={preventDefault(() => store.setActiveClient(client))}
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

<SystemsList />

{#snippet createNewClientForm()}
  <form
    onsubmit={preventDefault(createNewClient)}
    class="p-3 flex-none border-neutral-200 border-t flex"
  >
    <label class="join overflow-clip input-bordered border flex-1">
      <input
        required
        bind:value={newName}
        placeholder="Client name"
        class="input join-item flex-1 bg-base-100/10 font-normal"
      />
      <button
        type="submit"
        class="join-item btn btn-primary !rounded-none shadow-none flex-none"
        >Add Client</button
      >
    </label>
  </form>
{/snippet}

<style lang="postcss">
  .highlight {
    @apply bg-secondary/30 border-l-4 border-l-secondary;
  }
</style>
