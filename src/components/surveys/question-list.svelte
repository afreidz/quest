<script lang="ts">
  import clone from "@/utilities/clone";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import messages from "@/stores/messages.svelte";
  import { fileToDataUri } from "@/utilities/image";
  import { preventDefault } from "@/utilities/events";
  import { orderByPosition } from "@/utilities/order";
  import Editable from "@/components/app/editable.svelte";
  import type { RevisionFromAll } from "@/actions/revisions";
  import { surveysAndCharts as theme } from "@/utilities/theme";
  import ConfirmDialog from "@/components/app/confirm-dialog.svelte";
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

  let { editable: canEdit = false, survey, detailed = false }: Props = $props();

  let showDetails: boolean = $state(true);
  let detailsExposed: boolean = $derived(detailed && showDetails);

  let editable = $derived(
    canEdit && store.surveys.active?.type === "CHECKLIST"
  );

  let groups: Groups = $derived.by(() => {
    const groupedObj = Object.groupBy(
      clone((survey?.questions || store.surveys.active?.questions) ?? []),
      ({ group }) => group?.text ?? "null"
    );

    return orderByPosition(
      Object.entries(groupedObj).map(([groupName, questions], i) => ({
        name: groupName,
        image: questions?.[0].group?.imageURL ?? null,
        position: questions?.[0].group?.position ?? i + 1,
        id: questions?.[0].group?.id ?? `group_${+new Date()}`,
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
                      r.questionId === question.id && r.surveyId === surveyId
                  )
                  .map((resp) => resp.respondent.email),
                count: ro.responses.filter(
                  (r) => r.questionId === question.id && r.surveyId === surveyId
                ).length,
              };
            }),
        })),
      }))
    );
  });

  let clean = $derived.by(() => {
    const groupsClean = proposed.every(
      (p, i) => groups[i]?.id === p.id && groups[i]?.name === p.name
    );

    const questionsClean = groups.every((g, i) => {
      const p = proposed?.[i];
      if (!p) return false;
      return (
        g.questions.length === p.questions.length &&
        p.questions.every(
          (pq, i) =>
            g.questions[i].id === pq.id && g.questions[i].text === pq.text
        )
      );
    });

    const imagesClean = proposed.every((p, i) => groups[i]?.image === p?.image);

    return imagesClean && groupsClean && questionsClean;
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

  function getBadgeColor(
    num: number | null,
    min: number | null,
    max: number | null | undefined,
    p: boolean
  ) {
    if (num === null || min === null || max === null || max === undefined)
      return theme.neutral;
    if (p && num === max) return theme.positive;
    if (!p && num === max) return theme.negative;
    if (p && num === min) return theme.negative;
    if (!p && num === min) return theme.positive;
    if (p && num === max - 1) return theme.nearPositive;
    if (!p && num === max - 1) return theme.nearNegative;
    if (p && num === min + 1) return theme.nearNegative;
    if (!p && num === min + 1) return theme.nearPositive;
    return theme.neutral;
  }

  function createNewGroup() {
    if (!proposed) return newGroupDialog?.close();
    proposed.push({
      image: null,
      questions: [],
      name: newGroupName,
      position: proposed.length + 1,
      id: `proposed_group_${+new Date()}`,
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
        `unable to add question to group: ${newQuestionGroup}`
      );

    const question: Groups[number]["questions"][number] = {
      responses: [],
      positive: true,
      group: group.id,
      text: newQuestionText,
      id: `proposed_question_${+new Date()}`,
      position: group.questions.length + 1,
    };

    group.questions.push(question);
    newQuestionDialog?.close();
  }

  function removeQuestion(question: Question) {
    const group = proposed.find((g) => g.id === question.group);
    if (!group)
      throw messages.error(
        `unable to remove question from group: ${question.group}`
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
    await actions.surveys.deleteById(id);
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
      (g) => !proposed.find((p) => p.id === g.id)
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
      (e) => !proposedQuestions.find((p) => e.id === p.id)
    );

    if (
      (questionsDelta.removed.length || groupDelta.removed.length) &&
      !confirmed
    )
      return (showConfirmDialog = "save");

    await actions.surveys.updateChecklistById({
      id,
      data: { groups: groupDelta, questions: questionsDelta },
    });

    store.surveys.unsaved = false;
    await store.refreshActiveSurvey();
    proposed = clone(groups);
  }
</script>

{#snippet group(group: Groups[number])}
<div class="card-body p-6">
  {#if detailed}
    <div class="form-control flex items-end">
      <label class="label cursor-pointer">
        <span class="label-text mr-2">Show Respondents</span>
        <input
          type="checkbox"
          bind:checked="{showDetails}"
          class="toggle toggle-primary toggle-sm [--tglbg:#ffffff]"
        />
      </label>
    </div>
  {/if}
  {#if group.name !== "null"}
    <strong class="card-title flex justify-between items-center">
      <Editable
        size="sm"
        as="span"
        enabled="{editable}"
        value="{group.name}"
        onUpdate="{(s) => changeGroupName(s, group)}"
      />
      {#if editable}
        <div class="join">
          <button
            onclick="{() => removeGroup(group)}"
            data-tip="Remove group and all questions"
            class="btn btn-outline btn-sm join-item tooltip tooltip-left tooltip-primary"
          >
            <iconify-icon icon="mdi:trash-outline" class="pointer-events-none"
            ></iconify-icon>
          </button>
          <button
            data-tip="Add a question to group"
            onclick="{() => showNewQuestionForGroup(group)}"
            class="btn btn-outline btn-sm join-item tooltip tooltip-left tooltip-primary"
          >
            <iconify-icon icon="mdi:plus" class="pointer-events-none"
            ></iconify-icon>
          </button>
          <button
            data-tip="Drag to reorder group"
            class="btn btn-outline btn-sm handle join-item tooltip tooltip-left tooltip-primary"
          >
            <iconify-icon icon="mdi:chevron-up-down" class="pointer-events-none"
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
              src="{group.image}"
              alt="{group.name} screenshot"
              class="w-full"
            />
            <button
              class="btn btn-sm btn-secondary absolute rounded-full h-8 w-8 top-2 right-2 shadow-xl"
              onclick="{preventDefault(() => removeImage(group))}"
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
              multiple="{false}"
              onchange="{(e) => handleGroupImage(e.target, group)}"
            />
          {/if}
        </label>
      </div>
    {/if}
    <OrderableList
      class="flex-1"
      itemClass="group"
      render="{question}"
      enabled="{editable}"
      items="{group.questions}"
      onUpdate="{(updated) => {
        const newGroup = proposed?.find((p) => p.id === group.id);
        if (newGroup) newGroup.questions = updated;
      }}"
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
      enabled="{editable}"
      value="{question.text}"
      class="italic text-xl font-light"
      onUpdate="{(s) => changeQuestionText(s, question)}"
    />
    {#if !question.responses.length}
      <span class="badge">No responses yet</span>
    {:else}
      <ul class="join bg-base-100/10">
        {#each question.responses as response}
          <li class="join-item p-3 flex-1 border justify-between text-sm flex gap-2">
            <span class="flex-none">{response.label}</span>
            <strong class="flex-none w-5 h-5 text-xs leading-none flex items-center justify-center rounded-full" style="background-color: {getBadgeColor(
              response.value,
              question.responses[0].value,
              question.responses.at(-1)?.value,
              question.positive === false ? false : true
            )};">{response.count}</strong>
          </li>
        {/each}
      </ul>
    {/if}
    {#if detailsExposed}
      <ul class="join bg-base-100/10">
        {#each question.responses as response}
          <li
            class="join-item p-3 flex-1 border text-sm flex flex-col gap-1"
          >
            {#each response.respondents as respondent}
              <p class="badge badge-sm bg-base-100/20">{respondent ?? ""}</p>
            {/each}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  {#if editable}
    <div class="join self-end mb-2">
      <button
        onclick="{() => removeQuestion(question)}"
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
    <button
      class="btn btn-sm btn-outline flex-none"
      onclick="{() => (showNewGroupDialog = true)}"
    >
      <iconify-icon icon="mdi:plus" class="pointer-events-none"></iconify-icon>
      <span>Add Group</span>
    </button>
    <div class="flex item-center gap-4">
      <div class="join">
        <button
          disabled="{clean}"
          onclick="{() => (proposed = [...groups])}"
          class="btn btn-sm bg-base-100/50 flex-none join-item">Cancel</button
        >
        <button
          disabled="{clean}"
          onclick="{() => saveSurvey()}"
          class="btn btn-primary btn-sm flex-none join-item"
          >Save Changes</button
        >
      </div>
      <button
        onclick="{() => (showConfirmDialog = 'delete')}"
        disabled="{!clean}"
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
    bind:this="{newGroupDialog}"
    on:close="{() => {
      showNewGroupDialog = false;
      newGroupName = '';
    }}"
  >
    <div class="modal-box bg-neutral">
      <h3 class="font-bold text-lg flex items-center justify-between gap-3">
        Add a New Group
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost mb-3">✕</button>
        </form>
      </h3>
      <form
        onsubmit="{preventDefault(createNewGroup)}"
        class="p-3 flex-none border-neutral-200 border-t flex"
      >
        <label class="join overflow-clip input-bordered border flex-1">
          <input
            required
            placeholder="Group name"
            bind:value="{newGroupName}"
            bind:this="{newGroupNameInput}"
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
    bind:this="{newQuestionDialog}"
    on:close="{() => {
      showNewQuestionDialog = false;
      newQuestionGroup = null;
      newQuestionText = '';
    }}"
  >
    <div class="modal-box bg-neutral">
      <h3 class="font-bold text-lg flex items-center justify-between gap-3">
        Add a Question
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost mb-3">✕</button>
        </form>
      </h3>
      <form
        onsubmit="{preventDefault(createNewQuestion)}"
        class="p-3 flex-none border-neutral-200 border-t flex"
      >
        <label class="join overflow-clip input-bordered border flex-1">
          <input
            required
            placeholder="Group name"
            bind:value="{newQuestionText}"
            bind:this="{newQuestionInput}"
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
  <ConfirmDialog
    confirmText="YES"
    onclose="{handleConfirm}"
    bind:elm="{confirmDialog}"
    open="{!!showConfirmDialog}"
  >
    {#if showConfirmDialog === "save"}
      Are you sure you want make these updates? Some of the questions/groups
      have been removed. You will lose the connected responses and or questions
      from anything removed. This cannot be undone!
    {:else}
      Are you sure you want permanently delete this survey/checklist? You will
      lose the connected questions, groups and responses. This cannot be undone!
    {/if}
  </ConfirmDialog>
{/if}
<OrderableList
  class="w-full"
  render="{group}"
  enabled="{editable}"
  items="{clone(proposed ?? [])}"
  onUpdate="{(updated) => (proposed = updated)}"
  itemClass="card border bg-neutral shadow-sm rounded-box mb-4 outline-secondary"
/>
