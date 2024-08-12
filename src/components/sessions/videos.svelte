<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import { preventDefault } from "@/utilities/events";
  import { displayTimeFormatter } from "@/utilities/time";
  import { getRecordingSchedule } from "@/utilities/video";
  import CardHeader from "@/components/app/card-header.svelte";

  type Props = {
    onclick?: (r: (typeof recordingSchedules)[number]["recording"]) => void;
  };

  let { onclick }: Props = $props();
  let token: string | null = $state(null);
  let recordingSchedules: Awaited<ReturnType<typeof getRecordingSchedule>> =
    $state([]);

  onMount(async () => {
    token = (await actions.tokens.getBlobToken({})).data ?? null;
  });

  $effect(() => {
    if (store.sessions.active) {
      store.refreshRecordings();
    }
  });

  $effect(() => {
    if (token && store.recordings.all.length) {
      store
        .preloadRecordings(token)
        .then(() => getRecordingSchedule(store.recordings.all, token))
        .then((s) => (recordingSchedules = s));
    }
  });
</script>

<div class="collapse collapse-arrow rounded-none">
  <input type="checkbox" checked />
  <CardHeader
    icon="mdi:video-outline"
    class="bg-neutral border-t collapse-title"
  >
    <span> Session Videos </span>
  </CardHeader>
  <div class="collapse-content">
    <div class="flex-none overflow-auto m-3 border rounded-box">
      {#each recordingSchedules as result, i}
        <button
          onclick={preventDefault(() => {
            onclick?.(result.recording);
          })}
          class:highlight={store.recordings.active?.id === result.recording.id}
          class="btn btn-primary btn-lg btn-outline bg-neutral rounded-none w-full text-left border-neutral-200 border-t-0 border-r-0 border-l-0 last:border-b-0 flex"
        >
          <iconify-icon icon="mdi:video-outline"></iconify-icon>
          <span class="flex-1">Recording {i + 1}</span>
          <i class="badge badge-secondary"
            >{displayTimeFormatter.format(
              new Date(result.schedule.start.epochMilliseconds),
            )}-{displayTimeFormatter.format(
              new Date(result.schedule.end.epochMilliseconds),
            )}</i
          >
        </button>
      {/each}
    </div>
  </div>
</div>
