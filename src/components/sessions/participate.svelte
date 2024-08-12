<script lang="ts">
  import session from "@/stores/session.svelte";
  import type { DataMessage } from "@/utilities/data";
  import Actions from "@/components/sessions/actions.svelte";

  session.messenger?.on("message", (e: DataMessage) => {
    if (e.type === "push-url") url = e.url;
  });

  let url: string | null = $state(null);
</script>

<div class="flex-1 size-full flex flex-col items-center justify-center gap-4">
  <header class="w-full flex justify-end">
    {#each session.participants as participant}
      <div class="badge glass flex items-center gap-2">
        <iconify-icon
          class:text-error={participant.muted}
          class:text-success={participant.speaking}
          class:text-neutral-950={!participant.muted}
          icon="mdi:microphone{participant.muted ? '-off' : ''}"
        ></iconify-icon>
        <span>{participant.name}</span>
      </div>
    {/each}
  </header>
  <div class="flex-1 w-full text-center">
    <div
      class="mt-12 mx-auto mockup-browser bg-base-300/10 border shadow-sm max-h-[80vh] aspect-video"
    >
      <div class="mockup-browser-toolbar">
        <div class="input !bg-neutral"></div>
      </div>
      <div class="bg-neutral flex justify-center items-center size-full">
        {#if url}
          <iframe
            src={url}
            frameborder="0"
            class:hidden={!url}
            class="flex-1 size-full"
            title="Host's shared content"
          ></iframe>
        {:else}
          <span class="uppercase font-semibold text-base-200"
            >Waiting for host to push</span
          >
        {/if}
      </div>
    </div>
  </div>
  <Actions class="p-3" />
</div>
