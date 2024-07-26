<script lang="ts">
  import { onMount } from "svelte";
  import { timezone } from "@/utilities/time";
  import { Temporal } from "@js-temporal/polyfill";

  type Props = {
    until: string;
    run?: boolean;
  };

  let days = $state();
  let hours = $state();
  let minutes = $state();
  let seconds = $state();
  let { until, run = $bindable(true) }: Props = $props();
  let timer: ReturnType<typeof setInterval> | undefined = $state();

  $effect(() => {
    if (!run) return clearInterval(timer);
    timer = setInterval(update, 1000);
  });

  onMount(update);

  function update() {
    const now = Temporal.Now.zonedDateTimeISO(timezone);
    const instant = Temporal.Instant.from(until).toZonedDateTimeISO(timezone);

    const duration = now.until(instant, {
      largestUnit: "days",
      smallestUnit: "seconds",
    });

    days = Math.max(duration.days, 0);
    hours = Math.max(duration.hours, 0);
    minutes = Math.max(duration.minutes, 0);
    seconds = Math.max(duration.seconds, 0);
  }
</script>

<div class="grid auto-cols-max grid-flow-col gap-5 text-center">
  <div class="flex flex-col">
    <span class="countdown font-mono text-5xl">
      <span style="--value:{days};"></span>
    </span>
    days
  </div>
  <div class="flex flex-col">
    <span class="countdown font-mono text-5xl">
      <span style="--value:{hours};"></span>
    </span>
    hours
  </div>
  <div class="flex flex-col">
    <span class="countdown font-mono text-5xl">
      <span style="--value:{minutes};"></span>
    </span>
    min
  </div>
  <div class="flex flex-col">
    <span class="countdown font-mono text-5xl">
      <span style="--value:{seconds};"></span>
    </span>
    sec
  </div>
</div>
