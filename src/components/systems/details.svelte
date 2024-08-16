<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import Pane from "@/components/app/pane.svelte";
  import messages from "@/stores/messages.svelte";
  import { preventDefault } from "@/utilities/events";
  import Actions from "@/components/app/actions.svelte";
  import Scores from "@/components/systems/scores.svelte";
  import CustomizeScores from "@/components/app/customize.svelte";
  import ConfirmForm from "@/components/app/confirm-form.svelte";
  import RevisionList from "@/components/systems/revision-list.svelte";
  import QuestionList from "@/components/surveys/question-list.svelte";
  import ChecklistRadar from "@/components/surveys/checklist-radar.svelte";
  import RespondentList from "@/components/systems/respondent-list.svelte";

  type Props = {
    clientId: string;
    systemId: string;
  };

  let loading = $state(true);
  let editedTitle = $state("");
  let showEdit: boolean = $state(false);
  let showConfirmDelete: boolean = $state(false);

  let { clientId, systemId }: Props = $props();

  $effect(() => {
    if (store.revisions.active?.title && !editedTitle) {
      editedTitle = store.revisions.active.title;
    }
  });

  onMount(async () => {
    await store.refreshAllClients();
    const client = store.clients.all.find((c) => c.id === clientId);
    store.setActiveClient(client ?? null);
    await store.refreshAllSystems();
    const system = store.systems.all.find((s) => s.id === systemId);
    store.setActiveSystem(system ?? null);
    await store.refreshAllRevisions();
    loading = false;
  });

  async function deleteRevision(returnValue?: string) {
    showConfirmDelete = false;

    if (!store.revisions.active) return;
    if (!returnValue || returnValue !== store.revisions.active.title) return;

    const resp = await actions.revision
      .deleteById(store.revisions.active.id)
      .catch((err) => {
        messages.error(err.message, err.detail);
        return null;
      });

    if (!resp) return;
    await store.refreshAllRevisions();

    messages.success(`Revision deleted`, JSON.stringify(resp, null, 2));
    store.setActiveRevision(store.revisions.all[0] ?? null);
  }

  async function updateRevision() {
    showEdit = false;

    if (!store.revisions.active || !editedTitle) return;

    const resp = await actions.revision
      .updateById({
        id: store.revisions.active.id,
        data: {
          ...store.revisions.active,
          title: editedTitle,
        },
      })
      .catch((err) => {
        messages.error(err.message, err.detail);
        return null;
      });

    if (!resp) return;
    await store.refreshActiveRevision();

    messages.success(`Revision updated`, JSON.stringify(resp, null, 2));
    editedTitle = store.revisions.active.title;
  }
</script>

<RevisionList />
{#if loading}
  <div class="flex-1 flex items-center justify-center">
    <span class="loading loading-spinner loading-lg">Loading revision...</span>
  </div>
{:else if store.revisions.active}
  <div class="flex-1 p-4 overflow-auto">
    <section class="flex flex-col m-auto gap-6 w-full max-w-[1000px]">
      <div class="breadcrumbs text-sm !pb-0 pt-2">
        <ul>
          <li class="font-semibold">
            <a href={`/clients#${store.clients.active?.id}`}
              >{store.clients.active?.name}</a
            >
          </li>
          <li>{store.systems.active?.title}</li>
          <li>{store.revisions.active.title}</li>
        </ul>
      </div>
      <RespondentList />
      <QuestionList
        detailed
        detailsHideable={false}
        survey={store.revisions.active?.survey}
      />
      <QuestionList
        detailed
        editable={false}
        detailsHideable={false}
        survey={store.revisions.active?.checklist}
      />
    </section>
  </div>
  {#if store.revisions.all.length}
    <Pane
      collapsable
      location="right"
      class="overflow-auto"
      title="Revision Details"
      actions={revisionActions}
    >
      <Scores collapseable />
      <ChecklistRadar collapseable />
      <CustomizeScores />
    </Pane>
  {/if}
{/if}

{#snippet revisionActions()}
  <Actions
    size="sm"
    deleteTip="Delete Revision"
    editTip="Edit Revision Title"
    editForm={editRevisionForm}
    deleteForm={deleteRevisionForm}
    bind:editShown={showEdit}
    bind:deleteShown={showConfirmDelete}
  />
{/snippet}

{#snippet deleteRevisionForm()}
  <ConfirmForm
    confirmText={store.revisions.active?.title}
    onsubmit={deleteRevision}
  >
    Are you sure you want to delete this revision? You will lose all data
    associated with the revision and this is not reversible!
    <p>Please type "{store.revisions.active?.title}" to confirm</p>
  </ConfirmForm>
{/snippet}

{#snippet editRevisionForm()}
  <form
    onsubmit={preventDefault(updateRevision)}
    class="p-3 flex-none border-neutral-200 border-t flex"
  >
    <label class="join overflow-clip input-bordered border flex-1">
      <input
        required
        bind:value={editedTitle}
        placeholder={store.revisions.active?.title}
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
