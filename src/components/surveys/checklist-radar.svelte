<script lang="ts">
  import Chart, {
    type ChartOptions,
    type Chart as ChartType,
  } from "chart.js/auto";

  import { onMount } from "svelte";
  import store from "@/stores/global.svelte";
  import CardHeader from "@/components/app/card-header.svelte";
  import { surveysAndCharts as theme } from "@/utilities/theme";

  const dataColors = [
    theme.positive,
    theme.nearPositive,
    theme.nearNegative,
    theme.negative,
    theme.neutral,
  ];

  const LABELS = ["Pass", "Delayed", "Prompted", "Fail", "Skipped"];
  const VALUES = [65, 59, 90, 81, 10];

  let chart: ChartType | null = $state(null);
  let canvas: HTMLCanvasElement | null = $state(null);

  const radarOpts: (m: number) => ChartOptions = (max) => ({
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
        suggestedMax: max,
      },
    },
  });

  function createChart(options: ChartOptions) {
    if (chart) chart.destroy();
    chart = new Chart(canvas!, {
      type: "radar",
      options,
      data: {
        labels: LABELS,
        datasets: [
          {
            label: "Dataset 1",
            data: VALUES,
            fill: true,
            borderWidth: 1,
            pointRadius: 10,
            pointHitRadius: 10,
            pointBorderWidth: 0,
            pointHoverRadius: 10,
            pointHoverBorderWidth: 0,
            borderColor: theme.border,
            pointBackgroundColor: dataColors,
            backgroundColor: theme.background,
            pointHoverBackgroundColor: dataColors,
          },
        ],
      },
    });
  }

  onMount(() => createChart(radarOpts(95)));
</script>

<div class="flex-1">
  <CardHeader icon="mdi:radar">
    <span>Checklist results for {store.revisions.active?.title}</span>
  </CardHeader>
  <div class="p-4">
    <div class="aspect-square">
      <canvas bind:this="{canvas}"></canvas>
    </div>
    <!-- <ul class="w-1/3">
      {#each LABELS as label, i}
        <li>
          <strong>{label}:</strong>
          <small>{VALUES[i]}</small>
        </li>
      {/each}
    </ul> -->
  </div>
</div>
