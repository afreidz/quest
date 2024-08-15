<script lang="ts">
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import { debounce } from "@/utilities/events";
  import messages from "@/stores/messages.svelte";
  import Pane from "@/components/app/pane.svelte";
  import { preventDefault } from "@/utilities/events";
  import Actions from "@/components/app/actions.svelte";
  import Scores from "@/components/systems/scores.svelte";
  import Avatar from "@/components/respondents/avatar.svelte";
  import ChecklistRadar from "@/components/surveys/checklist-radar.svelte";
  import type { Respondents, RespondentSchema } from "@/actions/respondents";

  let loading = $state(false);
  let showNew = $state(false);
  let respondents: Respondents = $state([]);
  let search: HTMLInputElement | null = $state(null);
  let newRespondent: Partial<RespondentSchema> = $state({});

  $effect(() => {
    if (search) search.focus();
  });

  $effect(() => {
    if (showNew) handleRespondentSearch();
  });

  async function handleRespondentSearch() {
    if (!search?.value.trim()) {
      respondents = (await actions.respondents.getAll({})).data ?? [];
      return;
    }
    respondents =
      (await actions.respondents.getBySearch(search.value.trim())).data ?? [];
  }

  async function toggleExisting(r: Respondents[number]) {
    if (!store.revisions.active) return;
    const existing = store.revisions.active.respondents.find(
      (er) => er.id === r.id,
    );
    if (existing) {
      const resp = await actions.respondents.removeFromRevisions({
        id: r.id,
        revisionIds: [store.revisions.active.id],
      });

      if (resp.error) {
        messages.error("Unable to remove respondent from revision", resp.error);
      }
    } else {
      const resp = await actions.respondents.addToRevisions({
        id: r.id,
        revisionIds: [store.revisions.active.id],
      });

      if (resp.error) {
        messages.error("Unable to add respondent to revision", resp.error);
      }
    }
    await store.refreshActiveRevision();
  }

  async function createNewRespondent() {
    showNew = false;
    if (!store.revisions.active) return;

    loading = true;
    const resp = await actions.respondents.create({
      ...newRespondent,
      email: newRespondent.email!,
      revisionId: store.revisions.active.id,
    });

    loading = false;
    newRespondent = {};

    if (resp.error) {
      messages.error("Unable to add respondent to revision", resp.error);
      return;
    }

    await store.refreshActiveRevision();
    messages.success(
      "Respondent has been created",
      JSON.stringify(resp, null, 2),
    );
  }

  async function removeFromRevision(respondent: string) {
    if (!store.revisions.active) return;
    const resp = await actions.respondents.removeFromRevisions({
      id: respondent,
      revisionIds: [store.revisions.active.id],
    });

    if (resp.error) {
      messages.error("Unable to remove respondent from revision", resp.error);
    }

    await store.refreshActiveRevision();
    messages.success(
      "Respondent has been removed from the revision",
      JSON.stringify(resp, null, 2),
    );
  }
</script>

<div
  class="bg-neutral flex flex-col border-neutral-200 border rounded-box shadow-sm overflow-clip"
>
  <h2
    class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
  >
    <span>Respondents</span>
    <Actions
      bind:addShown={showNew}
      addForm={newRespondentForm}
      addTip="Add respondent to revision"
      class="max-w-[85vw] min-w-[800px] w-full max-h-[95vh] min-h-[800px] h-full flex flex-col"
    />
  </h2>
  <div class:skeleton={loading} class="bg-neutral flex-1 has-[:checked]:pb-4">
    {#if store.revisions.active}
      {#each store.revisions.active.respondents as respondent}
        <div class="collapse bg-neutral collapse-arrow group">
          <input type="checkbox" />
          <div
            class="collapse-title flex items-center font-semibold gap-3 border-b border-dotted group-has-[:checked]:border-b-0 group-last:border-b-0"
          >
            <Avatar {respondent} />
            <span class="flex-1">{respondent.name ?? respondent.email}</span>
          </div>
          <div
            class="collapse-content rounded-box bg-base-100/10 mx-3 flex flex-col"
          >
            <div class="flex justify-center mt-4">
              <ul class="join">
                <!-- <li class="btn btn-outline btn-sm join-item">
                  <a
                    href="#"
                    data-tip="View respondent details"
                    class="block tooltip-left tooltip tooltip-primary"
                  >
                    <iconify-icon icon="mdi:account-details"></iconify-icon>
                  </a>
                </li> -->
                <!-- <li class="btn btn-outline btn-sm join-item">
                  <a
                    href="#"
                    data-tip="Start a live session"
                    class="block tooltip-left tooltip tooltip-primary"
                  >
                    <iconify-icon icon="tabler:live-photo"></iconify-icon>
                  </a>
                </li> -->
                {#if store.revisions.active.survey}
                  <li class="btn btn-outline btn-sm join-item">
                    <a
                      target="_blank"
                      data-tip="Go to survey"
                      class="block tooltip-left tooltip tooltip-primary"
                      href={`/surveys/take/${store.revisions.active.survey.id}/${respondent.id}`}
                    >
                      <iconify-icon icon="ri:survey-line"></iconify-icon>
                    </a>
                  </li>
                {/if}
                {#if store.revisions.active.checklist}
                  <li class="btn btn-outline btn-sm join-item">
                    <a
                      target="_blank"
                      data-tip="Go to checklist"
                      class="block tooltip-left tooltip tooltip-primary"
                      href={`/checklist/${store.revisions.active.checklist.id}/${respondent.id}`}
                    >
                      <iconify-icon icon="ic:baseline-checklist"></iconify-icon>
                    </a>
                  </li>
                {/if}
                <li class="btn btn-outline btn-sm join-item">
                  <button
                    onclick={() => removeFromRevision(respondent.id)}
                    data-tip="Remove from revision"
                    class="block tooltip-left tooltip tooltip-primary"
                  >
                    <iconify-icon icon="mdi:remove"></iconify-icon>
                  </button>
                </li>
              </ul>
            </div>
            <div class="flex gap-3">
              <div class="bg-neutral rounded-box shadow-sm border mt-3 flex-1">
                <ChecklistRadar respondent={respondent.id} toggleDetails />
              </div>
              <div class="bg-neutral rounded-box shadow-sm border mt-3 flex-1">
                <Scores respondent={respondent.id} />
              </div>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

{#snippet searchForRespondent()}
  <div class="p-3 flex-none border-neutral-200 border-b">
    <label
      class="input input-bordered input-sm bg-base-100/10 flex items-center gap-2"
    >
      <input
        type="text"
        bind:this={search}
        placeholder="Search"
        class="grow skip-focus"
        oninput={debounce(handleRespondentSearch, 500)}
      />
      <iconify-icon class="text-xl" icon="material-symbols:search"
      ></iconify-icon>
    </label>
  </div>
{/snippet}

{#snippet doneAddingRespondents()}
  <footer class="flex p-3">
    <button
      onclick={preventDefault(() => (showNew = false))}
      class="btn btn-primary skip-focus w-full">Done</button
    >
  </footer>
{/snippet}

{#snippet renderRespondent(respondent: Respondents[number])}
  <label
    class:highlight={store.clients.active?.id === respondent.id}
    class="skip-focus btn btn-primary btn-lg btn-outline rounded-none w-full text-left border-neutral-200 border-t-0 border-r-0 border-l-0 flex"
  >
    <span class="flex-1">{respondent.name ?? respondent.email}</span>
    <input
      type="checkbox"
      class="checkbox checkbox-primary skip-focus"
      onchange={() => toggleExisting(respondent)}
      checked={store.revisions.active?.respondents.some(
        (r) => r.id === respondent.id,
      )}
    />
  </label>
{/snippet}

{#snippet newRespondentForm()}
  <form
    onsubmit={preventDefault(createNewRespondent)}
    class="flex-1 bg-base-100/10 border rounded-box flex font-normal overflow-clip"
  >
    <Pane
      {loading}
      min={320}
      size="sm"
      collapsable
      items={respondents}
      render={renderRespondent}
      prelist={searchForRespondent}
      title="Add Existing Respondent"
      postlist={doneAddingRespondents}
    />
    <div class="p-3 px-4 flex flex-col flex-1 gap-3">
      <header class="text-base font-semibold flex justify-between opacity-50">
        Create a New Respondent and Add To Revision
      </header>
      <section class="flex gap-8 w-full flex-none p-1">
        <label class="form-control flex-1">
          <div class="label">
            <span class="label-text">Email</span>
            <span class="label-text-alt italic">Required</span>
          </div>
          <input
            required
            type="email"
            bind:value={newRespondent.email}
            class="input input-bordered bg-neutral w-full"
          />
        </label>
        <div class="flex-1"></div>
      </section>
      <hr class="divide-x mt-6 border-dotted" />
      <div class="flex flex-1 gap-8">
        <section class="flex flex-col gap-2 flex-1 p-1">
          <label class="form-control flex-none">
            <div class="label">
              <span class="label-text">Name</span>
              <span class="label-text-alt italic">Optional</span>
            </div>
            <input
              type="text"
              bind:value={newRespondent.name}
              class="input input-bordered bg-neutral w-full"
            />
          </label>
          <label class="form-control flex-none">
            <div class="label">
              <span class="label-text">Title</span>
              <span class="label-text-alt italic">Optional</span>
            </div>
            <input
              type="text"
              bind:value={newRespondent.title}
              class="input input-bordered bg-neutral w-full"
            />
          </label>
        </section>
        <label class="form-control flex-1">
          <div class="label">
            <span class="label-text">Job Description/Bio</span>
            <span class="label-text-alt italic">Optional</span>
          </div>
          <textarea
            bind:value={newRespondent.profile}
            class="textarea textarea-bordered bg-neutral h-36"
          ></textarea>
        </label>
      </div>
      <footer class="flex-none flex justify-end gap-4 p-1">
        <button
          class="btn btn-ghost"
          onclick={preventDefault(() => (showNew = false))}
        >
          Cancel
        </button>
        <button type="submit" class="btn btn-primary">Add Respondent</button>
      </footer>
    </div>
  </form>
{/snippet}
