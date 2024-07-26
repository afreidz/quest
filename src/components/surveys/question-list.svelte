<script lang="ts">
  import clone from "@/utilities/clone";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import messages from "@/stores/messages.svelte";
  import { Temporal } from "@js-temporal/polyfill";
  import { fileToDataUri } from "@/utilities/image";
  import { getBadgeColor } from "@/utilities/theme";
  import { preventDefault } from "@/utilities/events";
  import { orderByPosition } from "@/utilities/order";
  import Editable from "@/components/app/editable.svelte";
  import type { RevisionFromAll } from "@/actions/revisions";
  import { findFirstFocusableElement } from "@/utilities/dom";
  import CardHeader from "@/components/app/card-header.svelte";
  import ConfirmForm from "@/components/app/confirm-form.svelte";
  import OrderableList from "@/components/app/orderable-list.svelte";

  type Props = {
    editable?: boolean;
    detailed?: boolean;
    survey?: RevisionFromAll["survey"];
  };

  type Groups = {
    id: string;
    name: string;
    image: string | null;
    questions: Question[];
    position: number | null;
  }[];

  type Question = {
    id: string;
    text: string;
    positive: boolean;
    group: string | null;
    position: number | null;
    responses: {
      id: string;
      label: string;
      count: number;
      value: number | null;
      respondents: string[];
    }[];
  };

  let proposed: Groups = $state([]);

  let newGroupName = $state("");
  let newQuestionText = $state("");
  let showNewGroupDialog: boolean = $state(false);
  let showNewQuestionDialog: boolean = $state(false);
  let confirmDialog: HTMLDialogElement | null = $state(null);
  let newQuestionGroup: Groups[number] | null = $state(null);
  let newGroupDialog: HTMLDialogElement | null = $state(null);
  let newQuestionInput: HTMLInputElement | null = $state(null);
  let newGroupNameInput: HTMLInputElement | null = $state(null);
  let showConfirmDialog: "save" | "delete" | null = $state(null);
  let newQuestionDialog: HTMLDialogElement | null = $state(null);

  let { editable: canEdit = false, survey, detailed = true }: Props = $props();

  let showDetails: boolean = $state(true);
  let detailsExposed: boolean = $derived(detailed && showDetails);
  let surveyType = $derived(survey?.type || store.surveys.active?.type);

  let editable = $derived(
    canEdit && store.surveys.active?.type === "CHECKLIST",
  );

  let groups: Groups = $derived.by(() => {
    const groupedObj = Object.groupBy(
      clone((survey?.questions || store.surveys.active?.questions) ?? []),
      ({ group }) => group?.text ?? "null",
    );

    return orderByPosition(
      Object.entries(groupedObj).map(([groupName, questions], i) => ({
        name: groupName,
        image: questions?.[0].group?.imageURL ?? null,
        position: questions?.[0].group?.position ?? i + 1,
        id:
          questions?.[0].group?.id ??
          `group_${Temporal.Now.instant().epochMicroseconds}`,
        questions: orderByPosition(questions ?? []).map((question) => ({
          id: question.id,
          text: question.text,
          group: question.groupId,
          position: question.position,
          positive: question.positive,
          responses: question.responseOptions
            .sort((a, b) => (a?.numericalValue ?? 0) - (b?.numericalValue ?? 0))
            .map((ro) => {
              const surveyId = survey?.id || store.surveys.active?.id;
              return {
                id: ro.id,
                label: ro.label,
                value: ro.numericalValue,
                respondents: ro.responses
                  .filter(
                    (r) =>
                      r.questionId === question.id && r.surveyId === surveyId,
                  )
                  .map((resp) => resp.respondent.email),
                count: ro.responses.filter(
                  (r) =>
                    r.questionId === question.id && r.surveyId === surveyId,
                ).length,
              };
            }),
        })),
      })),
    );
  });

  let clean = $derived.by(() => {
    const groupsClean = proposed.every(
      (p, i) => groups[i]?.id === p.id && groups[i]?.name === p.name,
    );

    const questionsClean = groups.every((g, i) => {
      const p = proposed?.[i];
      if (!p) return false;
      return (
        g.questions.length === p.questions.length &&
        p.questions.every(
          (pq, i) =>
            g.questions[i].id === pq.id && g.questions[i].text === pq.text,
        )
      );
    });

    const imagesClean = proposed.every((p, i) => groups[i]?.image === p?.image);

    return imagesClean && groupsClean && questionsClean;
  });

  let hasResponses = $derived.by(() => {
    return groups.some((g) =>
      g.questions.some((q) => q.responses.some((r) => r.count > 0)),
    );
  });

  $effect(() => {
    if (!detailed || !editable) showDetails = false;
    if (detailed || editable) showDetails = false;
    if (detailed && !editable) showDetails = true;
    if (detailed && !hasResponses) showDetails = false;
  });

  $effect(() => {
    store.surveys.unsaved = !clean;
  });

  $effect(() => {
    if (store.surveys.active || survey) proposed = clone(groups);
  });

  $effect(() => {
    if (showNewGroupDialog && newGroupDialog) {
      newGroupDialog.showModal();
      if (newGroupNameInput) newGroupNameInput.focus();
    }
  });

  $effect(() => {
    if (showNewQuestionDialog && newQuestionDialog) {
      newQuestionDialog.showModal();
      if (newQuestionInput) newQuestionInput.focus();
    }
  });

  $effect(() => {
    if (showConfirmDialog && confirmDialog) {
      confirmDialog.showModal();
      findFirstFocusableElement(confirmDialog, [".close-button"])?.focus();
    } else if (!showConfirmDialog && confirmDialog) {
      confirmDialog.close();
    }
  });

  function createNewGroup() {
    if (!proposed) return newGroupDialog?.close();
    proposed.push({
      image: null,
      questions: [],
      name: newGroupName,
      position: proposed.length + 1,
      id: `proposed_group_${Temporal.Now.instant().epochMicroseconds}`,
    });
    newGroupDialog?.close();
  }

  async function handleGroupImage(t: EventTarget | null, g: Groups[number]) {
    const target = t as HTMLInputElement;
    const group = proposed.find((p) => p.id === g.id);

    if (!group) throw messages.error(`unable to add image to group: ${g.id}`);

    group.image = await fileToDataUri(target.files);
  }

  function removeImage(g: Groups[number]) {
    const group = proposed.find((p) => p.id === g.id);

    if (!group)
      throw messages.error(`unable to remove image for group: ${g.id}`);
    group.image = null;
  }

  function showNewQuestionForGroup(group: Groups[number]) {
    showNewQuestionDialog = true;
    newQuestionGroup = group;
  }

  function createNewQuestion() {
    const group = proposed.find((g) => g.id === newQuestionGroup?.id);

    if (!group)
      throw messages.error(
        `unable to add question to group: ${newQuestionGroup}`,
      );

    const question: Groups[number]["questions"][number] = {
      responses: [],
      positive: true,
      group: group.id,
      text: newQuestionText,
      id: `proposed_question_${Temporal.Now.instant().epochMicroseconds}`,
      position: group.questions.length + 1,
    };

    group.questions.push(question);
    newQuestionDialog?.close();
  }

  function removeQuestion(question: Question) {
    const group = proposed.find((g) => g.id === question.group);
    if (!group)
      throw messages.error(
        `unable to remove question from group: ${question.group}`,
      );

    group.questions = group.questions.filter((q) => q.id !== question.id);
  }

  function removeGroup(group: Groups[number]) {
    const newGroups = proposed.filter((g) => g.id !== group.id);
    proposed = newGroups;
  }

  function handleConfirm(resp?: string) {
    const action = showConfirmDialog === "delete" ? deleteSurvey : saveSurvey;
    showConfirmDialog = null;
    if (resp !== "YES") return;
    return action(true);
  }

  function changeGroupName(s: string, g: Groups[number]) {
    const group = proposed.find((p) => g.id === p.id);
    if (!group) return;
    group.name = s;
  }

  function changeQuestionText(s: string, q: Question) {
    const question = proposed
      .map((p) => p.questions)
      .flat()
      .find((pq) => pq.id === q.id);
    if (!question) return;
    question.text = s;
  }

  async function deleteSurvey(confirmed: boolean | undefined = false) {
    const id = survey?.id || store.surveys.active?.id;
    if (!confirmed || !id) return;
    await actions.surveys.deleteById(id).catch((err) => {
      messages.error(err.message, err.detail);
    });
    store.setActiveSurvey(null);
    await store.refreshAllSurveys();
  }

  async function saveSurvey(confirmed: boolean | undefined = false) {
    const id = store.surveys.active?.id;

    if (!id) throw messages.error("Unable to find survey for saving");

    const groupDelta = Object.groupBy(proposed, (g) => {
      const existing = groups.find((e) => e.id === g.id);
      return existing &&
        existing.position === g.position &&
        existing.name === g.name
        ? "unchanged"
        : !existing
          ? "new"
          : "changed";
      return "removed";
    });

    groupDelta.removed = groups.filter(
      (g) => !proposed.find((p) => p.id === g.id),
    );

    const proposedQuestions = proposed.map((g) => g.questions).flat();
    const existingQuestions = groups.map((g) => g.questions).flat();

    const questionsDelta = Object.groupBy(proposedQuestions, (q) => {
      const existing = existingQuestions.find((e) => e.id === q.id);
      return existing &&
        existing.position === q.position &&
        existing.text === q.text
        ? "unchanged"
        : !existing
          ? "new"
          : "changed";
      return "removed";
    });

    questionsDelta.removed = existingQuestions.filter(
      (e) => !proposedQuestions.find((p) => e.id === p.id),
    );

    if (
      (questionsDelta.removed.length || groupDelta.removed.length) &&
      !confirmed
    )
      return (showConfirmDialog = "save");

    await actions.surveys
      .updateChecklistById({
        id,
        data: { groups: groupDelta, questions: questionsDelta },
      })
      .catch((err) => {
        messages.error(err.message, err.detail);
        return null;
      });

    store.surveys.unsaved = false;
    await store.refreshActiveSurvey();
    proposed = clone(groups);
  }
</script>

{#snippet toggleRespondents(s: "fixed" | undefined)}
  <div
    class:absolute={s !== "fixed"}
    class="form-control flex items-end top-2 right-2"
  >
    <label class="label cursor-pointer">
      <span class="label-text mr-2">Show Respondents</span>
      <input
        type="checkbox"
        bind:checked={showDetails}
        class="toggle toggle-primary toggle-sm [--tglbg:#ffffff]"
      />
    </label>
  </div>
{/snippet}

{#snippet group(group: Groups[number])}
  <div
    class="card-body p-6 {surveyType !== 'CHECKLIST' ? 'pt-0' : ''} relative"
  >
    {#if surveyType !== "CHECKLIST"}
      <CardHeader class="-mx-6">Survey Questions</CardHeader>
    {/if}
    {#if detailed && hasResponses && !editable && groups.findIndex((g) => group.id === g.id) === 0}
      {@render toggleRespondents(undefined)}
    {/if}
    {#if group.name !== "null"}
      <strong class="card-title flex justify-between items-center">
        <Editable
          size="sm"
          as="span"
          enabled={editable}
          value={group.name}
          onUpdate={(s) => changeGroupName(s, group)}
        />
        {#if editable}
          <div class="join">
            <button
              onclick={() => removeGroup(group)}
              data-tip="Remove group and all questions"
              class="btn btn-outline btn-sm join-item tooltip tooltip-left tooltip-primary"
            >
              <iconify-icon icon="mdi:trash-outline" class="pointer-events-none"
              ></iconify-icon>
            </button>
            <button
              data-tip="Add a question to group"
              onclick={() => showNewQuestionForGroup(group)}
              class="btn btn-outline btn-sm join-item tooltip tooltip-left tooltip-primary"
            >
              <iconify-icon icon="mdi:plus" class="pointer-events-none"
              ></iconify-icon>
            </button>
            <button
              data-tip="Drag to reorder group"
              class="btn btn-outline btn-sm handle join-item tooltip tooltip-left tooltip-primary"
            >
              <iconify-icon
                icon="mdi:chevron-up-down"
                class="pointer-events-none"
              ></iconify-icon>
            </button>
          </div>
        {/if}
      </strong>
    {/if}
    <div class="flex gap-4">
      {#if editable}
        <div class="flex-none w-1/4">
          <label
            class="bg-base-100/20 rounded flex items-center justify-center relative w-full min-h-60 aspect-square"
          >
            {#if group.image}
              <img
                src={group.image}
                alt="{group.name} screenshot"
                class="w-full"
              />
              <button
                class="btn btn-sm btn-secondary absolute rounded-full h-8 w-8 top-2 right-2 shadow-xl"
                onclick={preventDefault(() => removeImage(group))}
              >
                <iconify-icon icon="mdi:trash" class="pointer-events-none"
                ></iconify-icon>
              </button>
            {:else}
              <strong class="uppercase font-semibold opacity-50 text-sm"
                >Click to add image</strong
              >
              <input
                type="file"
                class="hidden"
                accept="image/*"
                multiple={false}
                onchange={(e) => handleGroupImage(e.target, group)}
              />
            {/if}
          </label>
        </div>
      {/if}
      <OrderableList
        class="flex-1"
        itemClass="group"
        render={question}
        enabled={editable}
        items={group.questions}
        onUpdate={(updated) => {
          const newGroup = proposed?.find((p) => p.id === group.id);
          if (newGroup) newGroup.questions = updated;
        }}
      />
    </div>
  </div>
{/snippet}

{#snippet question(question: Groups[number]["questions"][number])}
  <div
    class="flex items-start justify-start py-4 gap-6 border-b border-dotted group-last:border-b-0"
  >
    <aside class="flex-none w-8 text-center font-bold text-2xl">
      {question.position}
    </aside>
    <div class="flex-1 flex flex-col gap-4">
      <Editable
        as="span"
        size="sm"
        enabled={editable}
        value={question.text}
        class="italic text-xl font-light"
        onUpdate={(s) => changeQuestionText(s, question)}
      />
      {#if !question.responses.length}
        <span class="badge">No responses yet</span>
      {:else}
        <ul class="join bg-base-100/10">
          {#each question.responses as response}
            <li class="join-item p-3 flex-1 border text-sm flex flex-col gap-4">
              <div class="flex justify-between">
                <span class="flex-none">{response.label}</span>
                <strong
                  class="flex-none w-5 h-5 text-xs leading-none flex items-center justify-center rounded-full"
                  style="background-color: {getBadgeColor(
                    response.value,
                    question.responses[0].value,
                    question.responses.at(-1)?.value,
                    question.positive === false ? false : true,
                  )};">{response.count}</strong
                >
              </div>
              {#if detailsExposed}
                <ul class="border-t border-dotted pt-4">
                  {#each response.respondents as respondent}
                    <li class="badge badge-sm bg-base-100/20">
                      {respondent ?? ""}
                    </li>
                  {/each}
                </ul>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    {#if editable}
      <div class="join self-end mb-2">
        <button
          onclick={() => removeQuestion(question)}
          data-tip="Remove question and all responses"
          class="btn btn-outline btn-sm join-item tooltip tooltip-left tooltip-primary"
        >
          <iconify-icon icon="mdi:trash-outline" class="pointer-events-none"
          ></iconify-icon>
        </button>
        <button
          data-tip="Drag to reorder question"
          class="btn btn-outline btn-sm tooltip tooltip-left tooltip-primary handle join-item"
        >
          <iconify-icon icon="mdi:chevron-up-down" class="pointer-events-none"
          ></iconify-icon>
        </button>
      </div>
    {/if}
  </div>
{/snippet}

{#if editable}
  <div
    class="flex justify-between p-4 bg-neutral border rounded-box shadow-lg sticky top-4 left-0 right-0 z-[2]"
  >
    <div class="flex items-center gap-4">
      <button
        class="btn btn-sm btn-outline flex-none"
        onclick={() => (showNewGroupDialog = true)}
      >
        <iconify-icon icon="mdi:plus" class="pointer-events-none"
        ></iconify-icon>
        <span>Add Group</span>
      </button>
      {@render toggleRespondents("fixed")}
    </div>
    <div class="flex item-center gap-4">
      <div class="join">
        <button
          disabled={clean}
          onclick={() => (proposed = [...groups])}
          class="btn btn-sm bg-base-100/50 flex-none join-item">Cancel</button
        >
        <button
          disabled={clean}
          onclick={() => saveSurvey()}
          class="btn btn-primary btn-sm flex-none join-item"
          >Save Changes</button
        >
      </div>
      <button
        onclick={() => (showConfirmDialog = "delete")}
        disabled={!clean}
        class="btn btn-error btn-sm"
      >
        <iconify-icon icon="mdi:trash-outline" class="pointer-events-none"
        ></iconify-icon>
        <span>Permanently Delete</span>
      </button>
    </div>
  </div>
  <dialog
    class="modal"
    bind:this={newGroupDialog}
    onclose={() => {
      showNewGroupDialog = false;
      newGroupName = "";
    }}
  >
    <div class="modal-box bg-neutral">
      <h3 class="font-bold text-lg flex items-center justify-between gap-3">
        Add a New Group
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost mb-3">✕</button>
        </form>
      </h3>
      <form
        onsubmit={preventDefault(createNewGroup)}
        class="p-3 flex-none border-neutral-200 border-t flex"
      >
        <label class="join overflow-clip input-bordered border flex-1">
          <input
            required
            placeholder="Group name"
            bind:value={newGroupName}
            bind:this={newGroupNameInput}
            class="input join-item flex-1 bg-base-100/10"
          />
          <button
            type="submit"
            class="join-item btn btn-primary !rounded-none shadow-none flex-none"
            >Add Group</button
          >
        </label>
      </form>
    </div>
  </dialog>
  <dialog
    class="modal"
    bind:this={newQuestionDialog}
    onclose={() => {
      showNewQuestionDialog = false;
      newQuestionGroup = null;
      newQuestionText = "";
    }}
  >
    <div class="modal-box bg-neutral">
      <h3 class="font-bold text-lg flex items-center justify-between gap-3">
        Add a Question
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost mb-3">✕</button>
        </form>
      </h3>
      <form
        onsubmit={preventDefault(createNewQuestion)}
        class="p-3 flex-none border-neutral-200 border-t flex"
      >
        <label class="join overflow-clip input-bordered border flex-1">
          <input
            required
            placeholder="Group name"
            bind:value={newQuestionText}
            bind:this={newQuestionInput}
            class="input join-item flex-1 bg-base-100/10"
          />
          <button
            type="submit"
            class="join-item btn btn-primary !rounded-none shadow-none flex-none"
            >Add Question</button
          >
        </label>
      </form>
    </div>
  </dialog>
  <dialog
    bind:this={confirmDialog}
    class="modal"
    onclose={() => (showConfirmDialog = null)}
  >
    <div class="modal-box bg-neutral">
      <h3 class="font-bold text-lg flex items-center justify-between gap-3">
        Are you sure?
        <form method="dialog">
          <button class="close-button btn btn-sm btn-circle btn-ghost mb-3"
            >✕</button
          >
        </form>
      </h3>
      <ConfirmForm onsubmit={handleConfirm}>
        {#if showConfirmDialog === "save"}
          Are you sure you want make these updates? Some of the questions/groups
          have been removed. You will lose the connected responses and or
          questions from anything removed. This cannot be undone!
        {:else}
          Are you sure you want permanently delete this survey/checklist? You
          will lose the connected questions, groups and responses. This cannot
          be undone!
        {/if}
      </ConfirmForm>
    </div>
  </dialog>
{/if}
<OrderableList
  class="w-full"
  render={group}
  enabled={editable}
  items={clone(proposed ?? [])}
  onUpdate={(updated) => (proposed = updated)}
  itemClass="card border bg-neutral shadow-sm rounded-box mb-4 outline-secondary"
/>
