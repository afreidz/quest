<script lang="ts">
  import theme, { gauge } from "@/utilities/theme";
  import { roundAbsoluteToTwoDecimalPlaces } from "@/utilities/numbers";

  type ScorePair = [number, number?];

  type MappedScore = {
    color: string;
    value: number;
  };

  type Props = {
    vbw?: number;
    vbh?: number;
    gap?: number;
    class?: string;
    radius?: number;
    thickness?: number;
    svg?: SVGSVGElement;
    differential?: number;
    container?: HTMLElement;
    differentialSubtitle?: string;
    keys: [string?, string?, string?];
    values: [number?, number?, number?];
    scores:
      | [ScorePair]
      | [ScorePair, ScorePair]
      | [ScorePair, ScorePair, ScorePair];
  };

  function circumference(rad: number) {
    return 2 * Math.PI * rad;
  }

  function generateScoreData(scores: Props["scores"]): MappedScore[][] {
    return scores.map((scorePair, i): MappedScore[] => {
      const [first, second] = scorePair;

      let resultPair: MappedScore[];

      const baseColor =
        i === scores.length - 1 ? gauge.items.at(-1)! : gauge.items[i]!;

      if (typeof second === "undefined") {
        resultPair = [{ color: baseColor, value: first }];
      } else if (first > second) {
        resultPair = [
          { color: gauge.positive, value: first },
          { color: baseColor, value: second },
        ];
      } else if (first < second) {
        resultPair = [
          { color: gauge.negative, value: second },
          { color: baseColor, value: first },
        ];
      } else {
        resultPair = [
          { color: baseColor, value: first },
          { color: baseColor, value: second },
        ];
      }

      return resultPair;
    });
  }

  let {
    keys,
    scores,
    values,
    gap = 100,
    vbh = 5000,
    vbw = 10000,
    differential,
    radius = 4500,
    thickness = 800,
    class: className,
    svg = $bindable(),
    differentialSubtitle,
    container = $bindable(),
  }: Props = $props();
</script>

<div class={`relative @container ${className ?? ""}`} bind:this={container}>
  <ul class="">
    {#each keys as key, i}
      <li class="flex gap-2 items-center text-[clamp(11px,_2.5cqi,_18px)]">
        <i
          class="w-4 h-4 rounded"
          style={`background-color: ${gauge.items[i] ?? "black"};`}
        ></i>
        {key}
      </li>
    {/each}
  </ul>
  <svg
    bind:this={svg}
    style="width: 100%; transform: rotate(180deg);"
    viewBox="0 0 {vbw} {vbh}"
  >
    {#each generateScoreData(scores) as scoreset, i}
      {#if scoreset}
        <g>
          <circle
            cy="0%"
            cx="50%"
            fill="none"
            stroke-width={thickness}
            class="stroke-sus-primary-20"
            style="stroke: {theme.accent};"
            r={radius - (thickness + gap) * i}
            stroke-dasharray={`${circumference(radius - (thickness + gap) * i) / 2}, ${circumference(radius - (thickness + gap) * i)}`}
          ></circle>
          {#each scoreset as score, z}
            {#if score !== undefined}
              <circle
                cy="0%"
                cx="50%"
                fill="none"
                stroke={score.color}
                stroke-width={thickness}
                r={radius - (thickness + gap) * i}
                stroke-dasharray={`${(score.value / 100) * (circumference(radius - (thickness + gap) * i) / 2)}, ${circumference(radius - (thickness + gap) * i)}`}
              ></circle>
            {/if}
          {/each}
        </g>
      {/if}
    {/each}
  </svg>
  {#if differential !== undefined}
    <main
      style={`top: ${(thickness / vbh) * scores.length * 100 + (gap / vbh) * (scores.length + 1) * 100}%; margin-top: ${keys.length * 10}px;`}
      class="flex flex-col items-center justify-center absolute bottom-2 left-0 right-0"
    >
      <span class="font-light text-[clamp(11px,_3cqi,_18px)]">Differential</span
      >
      <strong
        style="color: {differential < 0 ? gauge.negative : gauge.positive};"
        class="leading-none font-black"
      >
        <iconify-icon
          class="text-[clamp(11px,_8cqi,_50px)]"
          icon="mdi:arrow-down-bold"
          class:rotate-180={differential >= 0}
        ></iconify-icon>
        <span class="flex-1 text-[clamp(11px,_10cqi,_80px)]"
          >{roundAbsoluteToTwoDecimalPlaces(differential)}</span
        >
      </strong>
      {#if differentialSubtitle}
        <span class="text-[clamp(11px,_3cqi,_18px)] font-light"
          >{differentialSubtitle}</span
        >
      {/if}
    </main>
  {/if}
  <footer>
    <ul class="flex">
      {#each values as value}
        <li
          class="text-[clamp(11px,_2.5cqi,_18px)] font-light text-center"
          style={`width: ${100 / (vbw / (gap + thickness))}%;`}
        >
          {#if value}
            {roundAbsoluteToTwoDecimalPlaces(value)}
          {/if}
        </li>
      {/each}
    </ul>
  </footer>
</div>
