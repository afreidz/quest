<script context="module" lang="ts">
  const BENCHMARK = 50;

  type Key = {
    label: string;
    color: string;
  };

  type Value = {
    number: number;
    color: string;
  };

  export type GaugeData = {
    keys: [Key, Key?, Key?];
    labels: [number, number?, number?];
    values: [[Value, Value?], [Value, Value?]?, [Value, Value?]?];
    highlight: {
      score: number;
      title: string;
      color: string;
      arrow: "up" | "down" | null;
    };
  };

  type KV = {
    key: string;
    value: number;
  };

  export type Props = {
    vbw?: number;
    vbh?: number;
    gap?: number;
    class?: string;
    radius?: number;
    thickness?: number;
    svg?: SVGSVGElement;
    container?: HTMLElement;

    score: KV;
    comparison?: KV;
    benchmark?: boolean;
    highlightSubtitle?: string;
  };
</script>

<script lang="ts">
  import theme, { gauge } from "@/utilities/theme";
  import { roundAbsoluteToTwoDecimalPlaces } from "@/utilities/numbers";

  function circumference(rad: number) {
    return 2 * Math.PI * rad;
  }

  const gaugeData = $derived.by(() => {
    if (score && !comparison && !benchmark) {
      return {
        labels: [score.value],
        keys: [{ label: score.key, color: gauge.items[0] }],
        values: [[{ number: score.value, color: gauge.items[0] }]],
        highlight: {
          arrow: null,
          title: "Score",
          score: score.value,
          color: gauge.items[0],
        },
      } satisfies GaugeData;
    }

    if (score && !comparison && benchmark) {
      const main = (
        score.value > BENCHMARK
          ? [
              { number: score.value, color: gauge.positive },
              { number: BENCHMARK, color: gauge.items[0] },
            ]
          : [
              { number: BENCHMARK, color: gauge.negative },
              { number: score.value, color: gauge.items[0] },
            ]
      ) satisfies GaugeData["values"][number];

      const diff =
        score.value > BENCHMARK
          ? score.value - BENCHMARK
          : BENCHMARK - score.value;

      const color = score.value > BENCHMARK ? gauge.positive : gauge.negative;
      const arrow = score.value > BENCHMARK ? "up" : "down";
      const title = "Differential";

      return {
        labels: [score.value, BENCHMARK],
        values: [main, [{ number: BENCHMARK, color: gauge.items[1] }]],
        keys: [
          { label: score.key, color: gauge.items[0] },
          { label: "Benchmark", color: gauge.items[1] },
        ],
        highlight: {
          arrow,
          title,
          color,
          score: diff,
        },
      } satisfies GaugeData;
    }

    if (score && comparison && !benchmark) {
      const main = (
        score.value > comparison.value
          ? [
              { number: score.value, color: gauge.positive },
              { number: comparison.value, color: gauge.items[1] },
            ]
          : [
              { number: comparison.value, color: gauge.negative },
              { number: score.value, color: gauge.items[1] },
            ]
      ) satisfies GaugeData["values"][number];

      const diff =
        score.value > comparison.value
          ? score.value - comparison.value
          : comparison.value - score.value;

      const color =
        score.value > comparison.value ? gauge.positive : gauge.negative;
      const arrow = score.value > comparison.value ? "up" : "down";
      const title = "Differential";

      return {
        labels: [comparison.value, score.value],
        values: [[{ number: comparison.value, color: gauge.items[0] }], main],
        keys: [
          { label: comparison.key, color: gauge.items[0] },
          { label: score.key, color: gauge.items[1] },
        ],
        highlight: {
          arrow,
          title,
          color,
          score: diff,
        },
      } satisfies GaugeData;
    }

    if (score && comparison && benchmark) {
      const main = (
        score.value > comparison.value
          ? [
              { number: score.value, color: gauge.positive },
              { number: comparison.value, color: gauge.items[1] },
            ]
          : [
              { number: comparison.value, color: gauge.negative },
              { number: score.value, color: gauge.items[1] },
            ]
      ) satisfies GaugeData["values"][number];

      const diff =
        score.value > comparison.value
          ? score.value - comparison.value
          : comparison.value - score.value;

      const color =
        score.value > comparison.value ? gauge.positive : gauge.negative;
      const arrow = score.value > comparison.value ? "up" : "down";
      const title = "Differential";

      return {
        labels: [comparison.value, score.value, BENCHMARK],
        values: [
          [{ number: comparison.value, color: gauge.items[0] }],
          main,
          [{ number: BENCHMARK, color: gauge.items[2] }],
        ],
        keys: [
          { label: comparison.key, color: gauge.items[0] },
          { label: score.key, color: gauge.items[1] },
          { label: "Benchmark", color: gauge.items[2] },
        ],
        highlight: {
          arrow,
          title,
          color,
          score: diff,
        },
      } satisfies GaugeData;
    }
  });

  let {
    score,
    gap = 100,
    vbh = 5000,
    vbw = 10000,
    radius = 4500,
    thickness = 800,
    class: className,
    svg = $bindable(),
    highlightSubtitle,
    container = $bindable(),
    comparison = $bindable(),
    benchmark = $bindable(false),
  }: Props = $props();
</script>

{#if gaugeData}
  <div
    class="{`relative @container ${className ?? ''}`}"
    bind:this="{container}"
  >
    <ul class="">
      {#each gaugeData.keys as key}
        <li class="flex gap-2 items-center text-[clamp(11px,_2.5cqi,_18px)]">
          <i class="w-4 h-4 rounded" style="{`background-color: ${key.color};`}"
          ></i>
          {key.label}
        </li>
      {/each}
    </ul>
    <svg
      bind:this="{svg}"
      style="width: 100%; transform: rotate(180deg);"
      viewBox="0 0 {vbw} {vbh}"
    >
      {#each gaugeData.values as score, i}
        {#if score}
          <g>
            <circle
              cy="0%"
              cx="50%"
              fill="none"
              stroke-width="{thickness}"
              class="stroke-sus-primary-20"
              style="stroke: {theme.accent};"
              r="{radius - (thickness + gap) * i}"
              stroke-dasharray="{`${circumference(radius - (thickness + gap) * i) / 2}, ${circumference(radius - (thickness + gap) * i)}`}"
            ></circle>
            {#each score as value}
              {#if value !== undefined}
                <circle
                  cy="0%"
                  cx="50%"
                  fill="none"
                  stroke="{value.color}"
                  stroke-width="{thickness}"
                  r="{radius - (thickness + gap) * i}"
                  stroke-dasharray="{`${(value.number / 100) * (circumference(radius - (thickness + gap) * i) / 2)}, ${circumference(radius - (thickness + gap) * i)}`}"
                ></circle>
              {/if}
            {/each}
          </g>
        {/if}
      {/each}
    </svg>
    {#if gaugeData.highlight}
      <main
        style="{`top: ${(thickness / vbh) * gaugeData.values.length * 100 + (gap / vbh) * (gaugeData.values.length + 1) * 100}%; margin-top: ${gaugeData.keys.length * 10}px;`}"
        class="flex flex-col items-center justify-center absolute bottom-2 left-0 right-0"
      >
        <span class="font-light text-[clamp(11px,_3cqi,_18px)]"
          >{gaugeData.highlight.title}</span
        >
        <strong
          style="color: {gaugeData.highlight.color};"
          class="leading-none font-black"
        >
          {#if gaugeData.highlight.arrow}
            <iconify-icon
              class="text-[clamp(11px,_8cqi,_50px)]"
              icon="mdi:arrow-down-bold"
              class:rotate-180="{gaugeData.highlight.arrow === 'up'}"
            ></iconify-icon>
          {/if}
          <span class="flex-1 text-[clamp(11px,_10cqi,_80px)]"
            >{roundAbsoluteToTwoDecimalPlaces(gaugeData.highlight.score)}</span
          >
        </strong>
        {#if highlightSubtitle}
          <span class="text-[clamp(11px,_3cqi,_18px)] font-light"
            >{highlightSubtitle}</span
          >
        {/if}
      </main>
    {/if}
    <footer>
      <ul class="flex">
        {#each gaugeData.labels as lable}
          <li
            class="text-[clamp(11px,_2.5cqi,_18px)] font-light text-center"
            style="{`width: ${100 / (vbw / (gap + thickness))}%;`}"
          >
            {#if lable}
              {roundAbsoluteToTwoDecimalPlaces(lable)}
            {/if}
          </li>
        {/each}
      </ul>
    </footer>
  </div>
{/if}
