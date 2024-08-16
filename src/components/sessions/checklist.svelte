<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import messages from "@/stores/messages.svelte";
  import { Temporal } from "@js-temporal/polyfill";
  import { orderByPosition } from "@/utilities/order";
  import type { SurveyQuestionGroup } from "@/utilities/order";
  import type { ResponsesByRespondent } from "@/actions/surveys";
  import type { SessionById, SessionFromAll } from "@/actions/sessions";

  type Props = {
    class?: string;
    respondent: string;
    survey:
      | NonNullable<SessionFromAll["revision"]["checklist"]>
      | NonNullable<SessionById["revision"]["checklist"]>;
  };

  let loading = $state(false);
  let groups: SurveyQuestionGroup = $state([]);
  let notes: HTMLTextAreaElement[] = $state([]);
  let existing: ResponsesByRespondent = $state([]);
  let activeCard: HTMLElement | null = $state(null);
  let active: SurveyQuestionGroup[number] | null = $state(null);
  let { survey, respondent, class: className = "" }: Props = $props();

  onMount(async () => {
    loading = true;
    const grouped = Object.groupBy(
      survey.questions,
      ({ group }) => group?.text ?? "null",
    );

    const responses = await actions.surveys.getResponsesByRespondent({
      respondent,
      survey: survey.id,
    });

    if (responses.error)
      messages.error("Unable to get responses", responses.error);

    existing = responses.data ?? [];

    groups = orderByPosition(
      Object.entries(grouped).map(([groupName, questions], i) => ({
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
            .sort((a, b) => {
              if (a.numericalValue === null && b.numericalValue === null)
                return 0;
              if (a.numericalValue === null) return 1;
              if (b.numericalValue === null) return -1;
              return b.numericalValue - a.numericalValue;
            })
            .map((ro) => {
              return {
                id: ro.id,
                label: ro.label,
                value: ro.numericalValue,
              };
            }),
        })),
      })),
    );

    active = groups[0];
    loading = false;
  });

  async function respond(q: string, r: string, n: HTMLTextAreaElement) {
    loading = true;
    await actions.surveys.respondToQuestion({
      survey: survey.id,
      question: q,
      respondent,
      response: r,
      freeForm: n.value,
    });
    loading = false;
  }
</script>

<div class="flex flex-col items-start w-full {className}">
  <div class="stack p-2 flex-1 items-start overflow-auto">
    {#if active}
      <div
        bind:this={activeCard}
        class="border bg-neutral rounded-box p-6 relative flex flex-col gap-4 justify-center items-center"
      >
        {#if active.name !== "null"}
          <strong class="w-full">
            <span>{active.name}</span>
          </strong>
        {/if}
        <ol class="w-full list-decimal ml-6">
          {#each active.questions as q, i (q.id)}
            <li>
              <span class="block">{q.text}</span>
              <ul class="join bg-base-100/10 mt-2">
                {#each q.responses as response}
                  {@const existingResponse = existing.find(
                    (r) => r.questionId === q.id,
                  )}
                  <li
                    class="join-item flex-1 border text-xs flex flex-col gap-4"
                  >
                    <label class="flex justify-between items-center gap-1 p-3">
                      <span class="flex-none">{response.label}</span>
                      <input
                        type="radio"
                        name={q.id}
                        disabled={loading}
                        class:radio-error={response.value === 0}
                        class:radio-success={response.value! > 2}
                        class:radio-info={response.value === null}
                        onchange={() => respond(q.id, response.id, notes[i])}
                        checked={existingResponse?.responseId === response.id}
                        class:radio-warning={[1, 2].includes(response.value!)}
                        class="radio radio-sm radio-primary !border-base-200 custom-radio"
                      />
                    </label>
                  </li>
                {/each}
              </ul>
              <div class="my-2 flex items-center justify-center">
                <textarea
                  disabled={loading}
                  bind:this={notes[i]}
                  class="textarea textarea-bordered bg-neutral w-[80%]"
                  placeholder="Moderator Notes"
                ></textarea>
              </div>
            </li>
          {/each}
        </ol>
      </div>
      {#each groups as _}
        <div
          class="border bg-neutral rounded-box p-6 relative flex flex-col gap-4 justify-center items-center"
          style="height: {activeCard?.getBoundingClientRect()?.height ?? 0}px;"
        ></div>
      {/each}
    {/if}
  </div>
  {#if groups.length}
    <footer class="my-2 flex justify-center w-full">
      <div class="join">
        {#each groups as group, i (group.id)}
          <button
            onclick={() => (active = groups[i])}
            class:bg-secondary={active?.id === group.id}
            class="join-item btn bg-base-100/20">{i + 1}</button
          >
        {/each}
      </div>
    </footer>
  {/if}
</div>

<style>
  .custom-radio {
    box-shadow:
      0 0 0 4px #fff inset,
      0 0 0 4px #fff inset !important;
  }
</style>
