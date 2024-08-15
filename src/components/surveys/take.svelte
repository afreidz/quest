<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import messages from "@/stores/messages.svelte";
  import { preventDefault } from "@/utilities/events";
  import { orderByPosition } from "@/utilities/order";
  import type { SurveyFromAll } from "@/actions/surveys";
  import type { RespondentFromAll } from "@/actions/respondents";

  type Props = {
    hideInfo?: boolean;
    survey: SurveyFromAll;
    respondent: RespondentFromAll;
  };

  let loading = $state(false);
  let completed = $state(false);
  let slides: HTMLElement[] = $state([]);
  let activeSlide: HTMLElement | null = $state(null);
  let existing: Record<string, string | null> = $state({});
  let responses: Record<string, string | null> = $state({});
  let { hideInfo = false, survey, respondent }: Props = $props();

  let clean = $derived(
    survey.questions.every((q) => {
      return existing[q.id] === responses[q.id];
    }),
  );

  onMount(() => {
    survey.questions.forEach((q) => {
      const resp = respondent.responses.find(
        (r) =>
          r.questionId === q.id &&
          r.surveyId === survey.id &&
          r.respondentId === respondent.id,
      );
      existing[q.id] = resp?.responseId ?? null;
      responses[q.id] = resp?.responseId ?? null;
    });
  });

  $effect(() => {
    if (slides[0] && !activeSlide) activeSlide = slides[0];
  });

  $effect(() => {
    if (activeSlide) activeSlide.scrollIntoView({ behavior: "smooth" });
  });

  function moveToNextSlide(current: number) {
    if (slides[current + 1]) activeSlide = slides[current + 1];
  }

  function updateValue(qid: string, rid: string) {
    const newResponses = { ...responses, [qid]: rid };
    responses = newResponses;
  }

  async function submitResponses() {
    if (Object.values(responses).some((r) => r === null)) {
      const missingId = Object.entries(responses).find(
        ([v]) => v === null,
      )?.[1];
      const index = orderByPosition(survey.questions).findIndex(
        (q) => q.id === missingId,
      );

      if (slides[index]) activeSlide = slides[index];
      return;
    }

    loading = true;

    const resp: Awaited<
      ReturnType<typeof actions.surveys.respondToQuestion>
    >[] = await Promise.all(
      survey.questions.map((q) => {
        return actions.public.respondToSurveyQuestion({
          question: q.id,
          survey: survey.id,
          respondent: respondent.id,
          response: responses[q.id]!,
        });
      }),
    );

    loading = false;

    if (resp.some((r) => r.error)) {
      messages.error(
        "Unable to save some responses",
        resp.map((r) => r.error).join("\n"),
      );
      return;
    }

    completed = true;
  }
</script>

{#if survey.revisionAsSurvey}
  <form
    onsubmit={preventDefault(() => submitResponses())}
    class="size-full flex-1 overflow-auto flex"
  >
    {#if !hideInfo}
      <header
        class="flex-none flex flex-col justify-center items-center gap-2 w-[400px] p-4"
      >
        <h2 class="text-3xl font-extrabold text-primary">
          System Usability Survey
        </h2>
        <p class="font-light text-center mx-4">
          This survey is designed to help understand the usability of <strong
            class="font-semibold">{survey.revisionAsSurvey.system.title}</strong
          >. Respondent email addresses are kept confidential and only used
          internally for identification purposes.
        </p>
        <p class="mt-8 mx-4 font-light text-center">
          This survey is intended for<strong class="font-semibold block"
            >{respondent.name || respondent.email}</strong
          > only.
        </p>
      </header>
    {/if}
    <main
      class:skeleton={loading}
      class="flex-1 rounded-box border bg-neutral m-4 mt-14 overflow-auto flex snap-mandatory snap-x"
    >
      {#if !loading}
        {#if completed}
          <div
            class="size-full shrink-0 snap-center flex flex-col items-center justify-center gap-8"
          >
            <strong
              class="text-4xl font-extrabold max-w-screen-lg my-4 text-center"
              >Thank you for submitting your responses!</strong
            >
          </div>
        {:else}
          {#each orderByPosition(survey.questions) as question, i (question.id)}
            <div
              bind:this={slides[i]}
              class="size-full shrink-0 snap-center flex flex-col items-center justify-center gap-8"
            >
              <strong
                class="text-4xl font-extrabold max-w-screen-lg my-4 text-center"
                >{question.text}</strong
              >
              <ul class="join bg-base-100/10">
                {#each question.responseOptions as response, j}
                  <li
                    class="join-item flex-1 border has-[:checked]:ring-1 ring-primary"
                  >
                    <div class="form-control p-3">
                      <label class="label cursor-pointer flex gap-3">
                        <input
                          required
                          type="radio"
                          name={question.id}
                          value={response.id}
                          onclick={() => moveToNextSlide(i)}
                          checked={responses[question.id] === response.id}
                          onchange={() => updateValue(question.id, response.id)}
                          class="radio radio-primary checked:shadow-[0_0_0_4px_#ffffff_inset,_0_0_0_4px_#ffffff_inset]"
                        />
                        <span class="label-text text-nowrap"
                          >{response.label}</span
                        >
                      </label>
                    </div>
                  </li>
                {/each}
              </ul>
              <i class="opacity-40">
                {#if i + 1 === survey.questions.length}
                  Submit your answers using the button below
                {:else}
                  Choose an answer to proceed to the next question
                {/if}
              </i>
            </div>
          {/each}
        {/if}
      {/if}
    </main>
    {#if !completed}
      <footer
        class:ml-[400px]={!hideInfo}
        class="fixed bottom-0 left-0 right-0 flex justify-center gap-4 p-10"
      >
        <button
          type="submit"
          disabled={clean || loading}
          class="btn btn-primary">Submit Responses</button
        >
      </footer>
    {/if}
  </form>
{/if}
