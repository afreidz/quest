<script lang="ts">
  import theme from "@/utilities/theme";

  type Props = {
    vbw?: number;
    vbh?: number;
    gap?: number;
    radius?: number;
    thickness?: number;
    svg?: SVGSVGElement;
    scores:
      | [[number, number?]]
      | [[number, number?], [number, number?]]
      | [[number, number?], [number, number?], [number, number?]];
  };

  function circumference(rad: number) {
    return 2 * Math.PI * rad;
  }

  let {
    scores,
    gap = 100,
    vbh = 5000,
    vbw = 10000,
    radius = 4500,
    thickness = 800,
    svg = $bindable(),
  }: Props = $props();
</script>

<svg
  bind:this={svg}
  style="width: 100%; transform: rotate(180deg);"
  viewBox="0 0 {vbw} {vbh}"
>
  {#each scores as scoreset, i}
    {#if scoreset}
      {@const sorted = [...scoreset]
        .sort()
        .reverse()
        .filter((s) => s !== undefined)}
      <g>
        <circle
          r={radius - (thickness + gap) * i}
          cx="50%"
          cy="0%"
          fill="none"
          stroke-dasharray={`${circumference(radius - (thickness + gap) * i) / 2}, ${circumference(radius - (thickness + gap) * i)}`}
          class="stroke-sus-primary-20"
          style="stroke: {theme.accent};"
          stroke-width={thickness}
        ></circle>
        {#each sorted as score, z}
          {#if score !== undefined}
            {@const strokeHex = [theme.secondary, "#95C4CB", theme.primary]}
            {@const positive = theme.success}
            {@const negative = theme.error}
            <circle
              r={radius - (thickness + gap) * i}
              cx="50%"
              cy="0%"
              fill="none"
              style={`stroke: ${
                z === 0 &&
                scoreset[1] !== undefined &&
                scoreset[1] > scoreset[0]
                  ? positive
                  : z === 0 &&
                      scoreset[1] !== undefined &&
                      scoreset[1] < scoreset[0]
                    ? negative
                    : strokeHex[i]
              }`}
              class:!stroke-sus-positive-40={z === 0 &&
                scoreset[1] !== undefined &&
                scoreset[1] > scoreset[0]}
              class:!stroke-sus-negative-40={z === 0 &&
                scoreset[1] !== undefined &&
                scoreset[1] < scoreset[0]}
              stroke-dasharray={`${(score / 100) * (circumference(radius - (thickness + gap) * i) / 2)}, ${circumference(radius - (thickness + gap) * i)}`}
              stroke-width={thickness}
            ></circle>
          {/if}
        {/each}
      </g>
    {/if}
  {/each}
</svg>
