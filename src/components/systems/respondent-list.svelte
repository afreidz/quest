<script lang="ts">
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import messages from "@/stores/messages.svelte";
  import { preventDefault } from "@/utilities/events";
  import Actions from "@/components/app/actions.svelte";
  import type { RevisionFromAll } from "@/actions/revisions";
  import Avatar from "@/components/respondents/avatar.svelte";
  import ChecklistRadar from "../surveys/checklist-radar.svelte";
  import Scores from "./scores.svelte";

  let newEmail = $state("");
  let loading = $state(false);
  let showNew = $state(false);
  let suggestionText = $state("");
  let suggestions = $state<RevisionFromAll["respondents"]>([]);

  // $effect(() => {
  //   if (newEmail) {
  //     suggestionText = "Or select an existing respondent from the list";
  //     actions.respondents
  //       .getBySearch(newEmail)
  //       .then((r) => (suggestions = r))
  //       .catch((err) => {
  //         messages.error(err.message, err.detail);
  //       });
  //   } else if (store.revisions.active?.respondents.length) {
  //     suggestions = store.revisions.active.respondents;
  //     suggestionText = "Toggle existing respondents";
  //   } else {
  //     suggestions = [];
  //   }
  // });

  async function toggleExisting(r: (typeof suggestions)[number]) {
    // if (!store.revisions.active) return;
    // const existing = store.revisions.active.respondents.find(
    //   (er) => er.id === r.id,
    // );
    // if (existing) {
    //   await actions.respondents
    //     .removeFromRevisions({
    //       id: r.id,
    //       revisionIds: [store.revisions.active.id],
    //     })
    //     .catch((err) => {
    //       messages.error(err.message, err.detail);
    //     });
    // } else {
    //   await actions.respondents
    //     .addToRevisions({
    //       id: r.id,
    //       revisionIds: [store.revisions.active.id],
    //     })
    //     .catch((err) => {
    //       messages.error(err.message, err.detail);
    //     });
    // }
    // await store.refreshActiveRevision();
  }

  async function createNewRespondent() {
    showNew = false;
    if (!store.revisions.active) return;

    loading = true;
    const resp = await actions.respondents
      .create({
        email: newEmail,
        revisionId: store.revisions.active.id,
      })
      .catch((err) => {
        messages.error(err.message, err.detail);
        return null;
      });

    loading = false;
    newEmail = "";

    if (!resp) return;

    await store.refreshActiveRevision();
    messages.success("Respondent has been created");
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
      addTip="Add respondent to revision"
      addForm={newRespondentForm}
      bind:addShown={showNew}
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
            <div class="flex justify-end mt-4">
              <ul class="join">
                <li class="btn btn-outline btn-sm join-item">
                  <a
                    href="#"
                    data-tip="Start a live session"
                    class="block tooltip-left tooltip tooltip-primary"
                  >
                    <iconify-icon icon="tabler:live-photo"></iconify-icon>
                  </a>
                </li>
                <li class="btn btn-outline btn-sm join-item">
                  <a
                    href="#"
                    data-tip="Go to survey"
                    class="block tooltip-left tooltip tooltip-primary"
                  >
                    <iconify-icon icon="ri:survey-line"></iconify-icon>
                  </a>
                </li>
                <li class="btn btn-outline btn-sm join-item">
                  <a
                    href="#"
                    data-tip="Go to checklist"
                    class="block tooltip-left tooltip tooltip-primary"
                  >
                    <iconify-icon icon="ic:baseline-checklist"></iconify-icon>
                  </a>
                </li>
                <li class="btn btn-outline btn-sm join-item">
                  <button
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

{#snippet newRespondentForm()}
  <form
    onsubmit={preventDefault(createNewRespondent)}
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
{/snippet}

<!-- {#if suggestions.length}
      <div class="text-center mb-2 text-sm">
        {suggestionText}
      </div>
      <ul class="mx-3">
        {#each suggestions as suggestion}
          {@const existing = store.revisions.active?.respondents.some(
            (r) => r.id === suggestion.id,
          )}
          <li class="form-control bg-base-100/10 mb-1 p-2 rounded">
            <label class="label cursor-pointer">
              <span class="label-text"
                >{suggestion.name ?? suggestion.email}</span
              >
              <input
                type="checkbox"
                checked={existing}
                class="checkbox checkbox-primary"
                onchange={preventDefault(() => toggleExisting(suggestion))}
              />
            </label>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</dialog> -->
