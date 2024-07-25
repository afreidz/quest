<script lang="ts">
  import { onMount } from "svelte";
  import store from "@/stores/global.svelte";
  import CardHeader from "@/components/app/card-header.svelte";
  import { surveysAndCharts as theme } from "@/utilities/theme";
  import Chart, { type Chart as ChartType } from "chart.js/auto";

  type Props = {
    respondent?: string;
    toggleDetails?: boolean;
  };

  const dataColors = [
    theme.positive,
    theme.nearPositive,
    theme.nearNegative,
    theme.negative,
    theme.neutral,
  ];

  let chart: ChartType | null = $state(null);
  let canvas: HTMLCanvasElement | null = $state(null);
  let { respondent: respondentId, toggleDetails = false }: Props = $props();
  let showDetails: boolean = $state(!toggleDetails);

  let labels = $derived.by(() => {
    const checklist = store.revisions.active?.checklist;
    if (!checklist) return [];
    return checklist.questions.reduce((labels, question) => {
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
    if (!store.revisions.active?.checklist) return [];
    const activeSurveyId = store.revisions.active.checklist.id;
    const activeQuestions = store.revisions.active.checklist.questions;

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
              (respondentId ? r.respondentId === respondentId : true),
          ).length ?? 0;
      });
      return Math.round((count * 100) / activeQuestions.length);
    });

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
              (respondentId ? r.respondentId === respondentId : true),
          ).length ?? 0;
      });
      return Math.round((count * 100) / comparedQuestions.length);
    });

    return [active, compared];
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

  onMount(createChart);
</script>

<div class="flex-1 group">
  <CardHeader icon="mdi:radar" class="border-t group-first:border-t-0">
    <span
      >Checklist Results {#if respondent}
        for {respondent.name ?? respondent.email}{/if}
    </span>
  </CardHeader>
  <div class="p-4 flex flex-col items-center">
    {#if toggleDetails}
      <div class="w-full form-control">
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
  </div>
</div>
