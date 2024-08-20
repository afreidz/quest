<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import { preventDefault } from "@/utilities/events";
  import CardHeader from "@/components/app/card-header.svelte";
  import type { SessionById, SessionFromAll } from "@/actions/sessions";

  type Props = {
    session: SessionFromAll | SessionById;
  };

  let { session }: Props = $props();
  let token: string | null = $state(null);

  let clips = $derived(
    store.recordings.all.filter((r) => r.type === "CLIP").map((r) => r.id),
  );
  let recordings = $derived(
    store.recordings.all.filter((r) => r.type === "FULL").map((r) => r.id),
  );

  onMount(async () => {
    token = (await actions.tokens.getBlobToken({})).data ?? null;
  });

  $effect(() => {
    if (store.sessions.active) {
      store.refreshRecordings();
    }
  });

  $effect(() => {
    if (token && session.recordings.length) {
      store.preloadRecordings(token);
    }
  });
</script>

<div class="collapse collapse-arrow rounded-none">
  <input type="checkbox" checked />
  <CardHeader
    icon="mdi:video-outline"
    class="bg-neutral border-t collapse-title"
  >
    <span> Session Recordings and Clips </span>
  </CardHeader>
  <div class="collapse-content">
    <div class="flex-none overflow-auto m-3 border rounded-box">
      {#each store.recordings.all as result}
        {@const count =
          result.type === "FULL"
            ? recordings.indexOf(result.id) + 1
            : clips.indexOf(result.id) + 1}
        <button
          onclick={preventDefault(() => {
            store.setActiveRecording(null);
            store.setActiveRecording(result);
          })}
          class:highlight={store.recordings.active?.id === result.id}
          class="btn btn-primary btn-lg btn-outline bg-neutral rounded-none w-full text-left border-neutral-200 border-t-0 border-r-0 border-l-0 last:border-b-0 flex"
        >
          <iconify-icon
            icon={result.type === "CLIP" ? "mdi:clip" : "mdi:video-outline"}
          ></iconify-icon>
          <span class="flex-1"
            >{result.type === "CLIP" ? "Clip" : "Recording"} {count}</span
          >
          <i class="badge badge-secondary"></i>
        </button>
      {/each}
    </div>
  </div>
</div>
