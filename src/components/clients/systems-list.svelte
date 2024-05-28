<script lang="ts">
  import { actions } from "astro:actions";
  import type { Systems } from "@/actions/systems";
  import type { ClientFromAll } from "@/actions/clients";

  type Props = {
    client: ClientFromAll;
  };

  let newName = $state("");
  let loading = $state(false);
  let newDialog: HTMLDialogElement;
  let systems = $state<Systems>([]);
  let showNewDialog = $state(false);

  $effect(() => {
    if (newDialog && showNewDialog) newDialog.showModal();
  });

  $effect(() => {
    if (client.id)
      actions.system.getByClientId(client.id).then((clientSystems) => {
        systems = clientSystems;
      });
  });

  async function createNewSystem() {
    loading = true;

    await actions.system.create({
      clientId: client.id,
      title: newName,
    });

    systems = await actions.system.getByClientId(client.id);

    showNewDialog = false;
    newDialog.close();
    loading = false;
    newName = "";
  }

  let { client }: Props = $props();
</script>

<div
  class="min-w-80 max-w-md w-1/3 bg-neutral flex flex-col border-neutral-200 border-r"
>
  <h2
    class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
  >
    <span>{client.name} Systems</span>
    <div
      class="tooltip tooltip-bottom tooltip-primary"
      data-tip="Add a system for {client.name}"
    >
      <button
        class="btn btn-sm btn-ghost"
        on:click={() => (showNewDialog = true)}
      >
        <iconify-icon class="text-xl" icon="ic:baseline-plus"></iconify-icon>
      </button>
    </div>
  </h2>
  <div
    class:skeleton={loading}
    class="bg-base-100/20 rounded-none flex-1 overflow-auto flex flex-col justify-center"
  >
    {#if !loading}
      {#each systems as system}
        <a
          href={`/systems/${system.id}`}
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
</div>

<dialog
  class="modal"
  bind:this={newDialog}
  on:close={() => (showNewDialog = false)}
>
  <div class="modal-box bg-neutral">
    <h3 class="font-bold text-lg flex items-center justify-between gap-3">
      Create a new system for {client.name}
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost mb-3">✕</button>
      </form>
    </h3>
    <form
      on:submit|preventDefault={createNewSystem}
      class="p-3 flex-none border-neutral-200 border-t flex"
    >
      <label class="join overflow-clip input-bordered border flex-1">
        <input
          required
          bind:value={newName}
          placeholder="{client.name} system name"
          class="input join-item flex-1 bg-base-100/10"
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
