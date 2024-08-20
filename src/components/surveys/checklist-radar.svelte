<script lang="ts">
  import store from "@/stores/global.svelte";
  import type { SurveyFromAll } from "@/actions/surveys";
  import CardHeader from "@/components/app/card-header.svelte";
  import { surveysAndCharts as theme } from "@/utilities/theme";
  import Chart, { type Chart as ChartType } from "chart.js/auto";
  import type { SessionById, SessionFromAll } from "@/actions/sessions";

  type Props = {
    class?: string;
    header?: boolean;
    showKey?: boolean;
    collapsed?: boolean;
    respondent?: string;
    headerClass?: string;
    showDetails?: boolean;
    collapseable?: boolean;
    toggleDetails?: boolean;
    showIfNoResponses?: boolean;
    checklist?:
      | SurveyFromAll
      | SessionFromAll["revision"]["checklist"]
      | SessionById["revision"]["checklist"];
  };

  const dataColors = [
    theme.positive,
    theme.nearPositive,
    theme.nearNegative,
    theme.negative,
    theme.neutral,
  ];

  let {
    checklist,
    header = true,
    showKey = true,
    headerClass = "",
    collapseable = false,
    toggleDetails = false,
    class: className = "",
    respondent: respondentId,
    showIfNoResponses = true,
    collapsed = $bindable(false),
    showDetails: defaultShowDetails,
  }: Props = $props();

  let chart: ChartType | null = $state(null);
  let canvas: HTMLCanvasElement | null = $state(null);
  let showDetails: boolean = $state(
    !toggleDetails && defaultShowDetails === undefined
      ? true
      : (defaultShowDetails ?? false),
  );

  let labels = $derived.by(() => {
    const survey = checklist || store.revisions.active?.checklist;
    if (!survey) return [];
    return survey.questions.reduce((labels, question) => {
      question.responseOptions.forEach((ro) => {
        if (!labels.includes(ro.label)) labels.push(ro.label);
      });
      return labels;
    }, [] as string[]);
  });

  let respondent = $derived(
    store.revisions.active?.respondents.find((r) => r.id === respondentId),
  );

  let values = $derived.by(() => {
    if (!checklist && !store.revisions.active?.checklist) return [];
    const activeSurveyId =
      (checklist?.id || store.revisions.active?.checklist?.id) ?? [];
    const activeQuestions =
      (checklist?.questions || store.revisions.active?.checklist?.questions) ??
      [];

    const respondents = checklist
      ? checklist.revisionAsChecklist?.respondents.map((r) => r.id)
      : store.revisions.active?.checklist?.revisionAsChecklist?.respondents.map(
          (r) => r.id,
        );

    const comparedSurveyId = store.revisions.compared?.checklist?.id;
    const comparedQuestions = store.revisions.compared?.checklist?.questions;

    const active = labels.map((label) => {
      let count = 0;
      activeQuestions.forEach((question) => {
        const match = question.responseOptions.find((ro) => ro.label === label);
        count +=
          match?.responses.filter(
            (r) =>
              r.surveyId === activeSurveyId &&
              r.questionId === question.id &&
              (respondentId
                ? r.respondentId === respondentId
                : respondents?.includes(r.respondentId)),
          ).length ?? 0;
      });
      return Math.round((count * 100) / activeQuestions.length);
    });

    if (active.every((v) => v === 0)) return [];

    if (!comparedQuestions?.length || !comparedSurveyId) return [active];

    const compared = labels.map((label) => {
      let count = 0;
      comparedQuestions.forEach((question) => {
        const match = question.responseOptions.find((ro) => ro.label === label);
        count +=
          match?.responses.filter(
            (r) =>
              r.surveyId === comparedSurveyId &&
              r.questionId === question.id &&
              (respondentId
                ? r.respondentId === respondentId
                : respondents?.includes(r.respondentId)),
          ).length ?? 0;
      });
      return Math.round((count * 100) / comparedQuestions.length);
    });

    if (active.every((v) => v === 0) && compared.every((v) => v === 0))
      return [];

    return [active, compared];
  });

  $effect(() => {
    if (canvas) createChart();
  });

  function createChart() {
    if (!canvas) return;

    chart = new Chart(canvas, {
      type: "radar",
      options: {
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: false,
        scales: {
          r: {
            grid: {
              circular: true,
              color: theme.border,
            },
            angleLines: {
              color: theme.border,
            },
            pointLabels: {
              display: true,
            },
            ticks: {
              display: false,
            },
            suggestedMin: 0,
            suggestedMax: 100,
          },
        },
      },
      data: {
        labels: [],
        datasets: [],
      },
    });
  }

  $effect(() => {
    if (chart && values && labels) {
      if (chart.options.scales?.r)
        chart.options.scales.r.suggestedMax = Math.max(...values.flat()) + 1;
      (chart.data.labels = labels),
        (chart.data.datasets = values.map((values) => ({
          fill: true,
          data: values,
          borderWidth: 1,
          pointRadius: 8,
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0,
          borderColor: theme.border,
          pointBackgroundColor: dataColors,
          backgroundColor: theme.backgrounds,
          pointHoverBackgroundColor: dataColors,
        })));
      chart.update();
    }
  });
</script>

{#if showIfNoResponses || values.length !== 0}
  <div
    class:collapse={collapseable}
    class="flex-1 group rounded-none border-b-0 collapse-arrow {className}"
  >
    {#if collapseable}
      <input type="checkbox" checked={!collapsed} />
    {/if}
    {#if header}
      <CardHeader
        icon="mdi:radar"
        class="border-t group-first:border-t-0 {collapseable
          ? 'collapse-title'
          : ''} {headerClass}"
      >
        <span
          >Checklist Results {#if respondent}
            for {respondent.name ?? respondent.email}{/if}
        </span>
      </CardHeader>
    {/if}
    <div
      class:p-4={!collapseable}
      class:collapse-content={collapseable}
      class="p-4 flex flex-col items-center"
    >
      {#if toggleDetails}
        <div class:pt-4={collapseable} class="w-full form-control">
          <label class="label cursor-pointer flex-none justify-end gap-2 p-0">
            <span class="label-text">Show details</span>
            <input
              type="checkbox"
              bind:checked={showDetails}
              class="toggle toggle-xs toggle-primary [--tglbg:#ffffff]"
            />
          </label>
        </div>
      {/if}
      <div
        class="aspect-square w-full max-w-[360px] flex items-center justify-center"
      >
        <canvas class="flex-1" bind:this={canvas} class:!hidden={!values.length}
        ></canvas>
        {#if !values.length}
          <strong class="uppercase font-semibold opacity-50"
            >No checklist responses for this revision</strong
          >
        {/if}
      </div>
      {#if showKey}
        {#if !toggleDetails || showDetails}
          {#if values.length > 1}
            <div class="flex w-full justify-evenly p-3 text-xs">
              <strong class="flex gap-2 items-center">
                <span>{store.revisions.active?.title}</span>
                <i
                  class="inline-block w-4 h-4 rounded-full"
                  style="background-color: {theme.backgrounds[0]};"
                ></i>
              </strong>
              {#if values[1]}
                <strong class="flex gap-2 items-center">
                  <span>{store.revisions.compared?.title}</span>
                  <i
                    class="inline-block w-4 h-4 rounded-full"
                    style="background-color: {theme.backgrounds[1]};"
                  ></i>
                </strong>
              {/if}
            </div>
          {/if}
          {#if values.length}
            <ul class="rounded-box border flex flex-col px-3 py-1 w-full">
              {#each labels as label, i}
                <li
                  class="flex justify-between text-sm border-b border-dotted last:border-b-0 p-1"
                >
                  <strong class="flex-1 flex items-center gap-2">
                    <i
                      class="inline-block w-4 h-4 rounded-full"
                      style="background-color: {dataColors[i]};"
                    ></i>
                    <span>{label}:</span>
                  </strong>
                  <div class="flex gap-2">
                    {#each values as valueset, j}
                      <small
                        class="flex-none p-1 h-5 text-xs leading-none flex items-center justify-center rounded-full"
                        style="background-color: {theme.backgrounds[j]};"
                        >{valueset[i]}%</small
                      >
                    {/each}
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        {/if}
      {/if}
    </div>
  </div>
{/if}
