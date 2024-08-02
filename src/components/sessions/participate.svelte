<script lang="ts">
  import session from "@/stores/session.svelte";
  import Actions from "@/components/sessions/actions.svelte";

  $effect(() => {
    if (session.pip) console.log("PIP Update");
  });
</script>

<div class="flex-1 size-full flex flex-col items-center justify-center gap-4">
  <header class="w-full flex -mt-16 justify-end">
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
      class="mx-auto mockup-browser bg-base-300/10 border shadow-sm max-h-[88vh] aspect-video"
    >
      <div class="mockup-browser-toolbar">
        <div class="input !bg-neutral"></div>
      </div>
      <div class="bg-neutral flex justify-center items-center size-full">
        <span class="uppercase font-semibold text-base-200"
          >Waiting for host to push</span
        >
      </div>
    </div>
  </div>
  <Actions pip={session.pip} />
</div>
