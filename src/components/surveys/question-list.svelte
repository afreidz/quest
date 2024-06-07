<script lang="ts">
  import { flip } from "svelte/animate";
  import type { SurveyFromAll } from "@/actions/surveys";
  import CardHeader from "@/components/app/card-header.svelte";
  import type { SurveyFromRevision } from "@/actions/revisions";
  import { dragHandleZone, dragHandle } from "svelte-dnd-action";

  type Props = {
    hideType?: boolean;
    survey: SurveyFromAll | SurveyFromRevision;
  };

  const flipDurationMs = 300;

  let reordered = $state<SurveyFromAll["questions"]>([]);
  let { survey, hideType = false }: Props = $props();
  let surveyType = $derived(
    survey.type === "CHECKLIST"
      ? "checklist"
      : survey.type === "SUS_CURRENT"
        ? "SUS current"
        : "SUS proposed"
  );

  let orderedQuestions = $derived.by(() => {
    if (reordered.length) return reordered;
    if (!survey.questions.length) return [];
    const questions = [...survey.questions];
    return questions.sort((a, b) =>
      !a.position || !b.position ? 0 : a.position - b.position
    );
  });

  $effect(() => {
    if (survey) reordered = [];
  });

  function consider(e: CustomEvent) {
    reordered = e.detail.items;
  }

  async function reorder(e: CustomEvent) {
    reordered = e.detail.items;
  }
</script>

<div>
  <CardHeader border={false}>
    Questions
    <aside class="flex items-center gap-3" slot="pull">
      {#if !hideType}
        <span>Type:</span>
        <span class="badge badge-secondary font-semibold">{surveyType}</span>
      {/if}
    </aside>
  </CardHeader>
  <ol
    onfinalize={reorder}
    onconsider={consider}
    class="rounded ring-offset-4 ring-offset-neutral-100 ring-secondary max-w-2xl"
    use:dragHandleZone={{
      flipDurationMs,
      items: orderedQuestions,
      dropTargetClasses: ["ring", "!outline-none"],
    }}
  >
    {#each orderedQuestions as question (question.id)}
      <li
        class="rounded bg-neutral p-2 italic mb-2 !outline-secondary flex items-center justify-center gap-4"
        animate:flip={{ duration: flipDurationMs }}
      >
        {#if survey.type === "CHECKLIST"}
          <span class="flex-none text-neutral-200" use:dragHandle>
            <iconify-icon icon="mdi:reorder-horizontal"></iconify-icon>
          </span>
        {/if}
        <div class="collapse collapse-arrow">
          <input type="checkbox" />
          <div class="collapse-title flex-1">
            {question.position}. {question.text}
          </div>
          <div class="collapse-content not-italic">
            <strong>Responses:</strong>
            <ol class="join">
              {#each question.responseOptions as response}
                {@const count = response.responses.filter(
                  (r) =>
                    r.surveyId === survey.id && r.questionId === question.id
                ).length}
                <li class="join-item border p-4">
                  {response.label}: <strong>{count}</strong>
                </li>
              {/each}
            </ol>
          </div>
        </div>
      </li>
    {/each}
  </ol>
</div>
