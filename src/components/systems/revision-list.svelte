<script lang="ts">
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import { SurveyType } from "@hsalux/quest-db";
  import messages from "@/stores/messages.svelte";
  import { preventDefault } from "@/utilities/events";
  import Actions from "@/components/app/actions.svelte";
  import ConfirmForm from "@/components/app/confirm-form.svelte";

  let loading = $state(false);
  let showConfirmDelete = $state(false);

  let editedTitle = $state("");
  let showEdit = $state(false);

  let newName = $state("");
  let showNewRevision = $state(false);
  let newSurveyInput: HTMLSelectElement | null = $state(null);
  let surveyType = $state<keyof typeof SurveyType | undefined>();

  $effect(() => {
    if (store.systems.active?.title && !editedTitle) {
      editedTitle = store.systems.active.title;
    }
  });

  $effect(() => {
    if (!store.revisions.all.length) return;
    const revision = store.revisions.all.find((r) =>
      window.location.hash.includes(r.id),
    );
    store.setActiveRevision(revision || store.revisions.all[0]);
    window.location.hash = "";
  });

  async function deleteSystem(returnValue?: string) {
    showConfirmDelete = false;

    if (!returnValue || returnValue !== store.systems.active?.title) return;
    if (!store.systems.active) return;

    loading = true;
    const resp = await actions.system
      .deleteById(store.systems.active.id)
      .catch((err) => {
        messages.error(err.message, err.detail);
        return null;
      });
    loading = false;

    if (!resp) return;
    window.history.back();
  }

  async function updateSystem() {
    showEdit = false;

    if (!store.systems.active || !editedTitle) return;

    loading = true;
    const resp = await actions.system
      .updateById({
        id: store.systems.active.id,
        data: {
          ...store.systems.active,
          title: editedTitle,
        },
      })
      .catch((err) => {
        messages.error(err.message, err.detail);
      });
    await store.refreshActiveSystem();

    loading = false;
    editedTitle = store.systems.active.title;

    if (!resp) return;
    messages.success(`System updated`, JSON.stringify(resp, null, 2));
  }

  function navigateToRevision(r: typeof store.revisions.active) {
    if (store.revisions.unsaved) return;
    store.setActiveRevision(r);
    window.history.replaceState(null, "", `#${r?.id}`);
  }

  async function createNewRevision() {
    showNewRevision = false;
    if (!store.systems.active) return;

    loading = true;
    const resp = await actions.revision
      .create({
        surveyType,
        title: newName,
        systemId: store.systems.active.id,
      })
      .catch((err) => {
        messages.error(err.message, err.detail);
      });
    await store.refreshAllRevisions();

    newName = "";
    loading = false;
    surveyType = undefined;

    if (!resp) return;
    messages.success(`Revision Added`, JSON.stringify(resp, null, 2));
  }
</script>

{#if store.systems.active}
  <div
    class="min-w-80 max-w-[400px] w-full bg-neutral flex flex-col border-neutral-200 border-r sticky top-0"
  >
    <h2
      class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
    >
      <span>{store.systems.active.title} Revisions</span>
      <Actions
        deleteTip="Delete System"
        editTip="Edit System Name"
        addTip="Add Revision to System"
        addForm={newRevisionForm}
        editForm={updateSystemForm}
        deleteForm={deleteSystemForm}
        bind:editShown={showEdit}
        bind:addShown={showNewRevision}
        bind:deleteShown={showConfirmDelete}
      />
    </h2>
    <div
      class:skeleton={loading}
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
              class:highlight={store.revisions.active?.id === revision.id}
              class="btn btn-primary btn-lg btn-outline rounded-none w-full text-left pl-0 border-neutral-200 border-t-0 border-r-0 border-l-0 flex"
            >
              <a
                href="#{revision.id}"
                class:tooltip={store.revisions.unsaved}
                on:click={preventDefault(() => navigateToRevision(revision))}
                data-tip={"You have unsaved changes to the current revision!"}
                class="flex-1 h-full flex items-center pl-4">{revision.title}</a
              >
            </div>
          {/each}
        {/if}
      {/if}
    </div>
  </div>
{/if}

{#snippet updateSystemForm()}
  <form
    onsubmit={preventDefault(updateSystem)}
    class="p-3 flex-none border-neutral-200 border-t flex"
  >
    <label class="join overflow-clip input-bordered border flex-1">
      <input
        required
        bind:value={editedTitle}
        placeholder={store.systems.active?.title}
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

{#snippet deleteSystemForm()}
  <ConfirmForm
    confirmText={store.systems.active?.title}
    onsubmit={deleteSystem}
  >
    Are you sure you want to delete this system? You will lose all data
    associated with the system and this is not reversible!
    <p>Please type "{store.systems.active?.title}" to confirm</p>
  </ConfirmForm>
{/snippet}

{#snippet newRevisionForm()}
  <form
    onsubmit={preventDefault(createNewRevision)}
    class="p-3 flex-none border-neutral-200 border-t flex flex-col gap-2 font-normal"
  >
    <select
      bind:value={surveyType}
      bind:this={newSurveyInput}
      class="select select-bordered bg-base-100/10 w-full"
    >
      <option disabled selected>What type of revision is this?</option>
      {#each Object.keys(SurveyType).filter((k) => !k.includes("CHECKLIST")) as type}
        <option value={type}
          >{type.includes("CURRENT")
            ? "Current State Survey Type"
            : "Proposed State Survey Type"}</option
        >
      {/each}
    </select>
    <label class="join overflow-clip input-bordered border flex-1">
      <input
        required
        bind:value={newName}
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
{/snippet}

<style lang="postcss">
  .highlight {
    @apply bg-secondary/30 border-l-4 border-l-secondary;
  }
</style>
