<script lang="ts">
  import { actions } from "astro:actions";
  import type { SystemFromAll } from "@/actions/systems";

  type Props = {
    system: string;
  };

  let newEmail = $state("");
  let loading = $state(true);
  let newDialog: HTMLDialogElement;
  let showNewDialog = $state(false);
  let system = $state<SystemFromAll | null>(null);

  $effect(() => {
    if (newDialog && showNewDialog) newDialog.showModal();
  });

  $effect(() => {
    if (!system && systemId) refreshSystem();
  });

  async function refreshSystem() {
    loading = true;
    system = await actions.system.getById(systemId);
    loading = false;
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

<div
  class="min-w-80 max-w-md w-1/3 bg-neutral flex flex-col border-neutral-200 border-l"
>
  <h2
    class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
  >
    <span>Respondents</span>
    <div
      class="tooltip tooltip-bottom tooltip-primary"
      data-tip="Invite a respondent for {system?.title}"
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
    class="bg-neutral rounded-none flex-1 overflow-auto"
  >
    {#if !loading && !!system}
      {#each system.respondents as respondent}
        <button
          class="btn bg-neutral btn-primary btn-lg btn-outline rounded-none w-full text-left border-neutral-200 border-r-0 border-l-0 border-t-0 flex items-center"
        >
          <div
            class:placeholder={!respondent.imageURL}
            class="avatar flex-none"
          >
            <div class="bg-secondary text-secondary-content rounded-full w-10">
              {#if respondent.imageURL}
                <img src={respondent.imageURL} alt={respondent.email} />
              {:else}
                <span class="text-xl"
                  >{respondent.email.charAt(0).toLocaleUpperCase()}</span
                >
              {/if}
            </div>
          </div>
          <span class="flex-1">{respondent.email}</span>
        </button>
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
      New respondent for {system?.title}
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost mb-3">✕</button>
      </form>
    </h3>
    <form
      on:submit|preventDefault={createNewRespondent}
      class="p-3 flex-none border-neutral-200 border-t flex"
    >
      <label class="join overflow-clip input-bordered border flex-1">
        <input
          required
          type="email"
          bind:value={newEmail}
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
  </div>
</dialog>
