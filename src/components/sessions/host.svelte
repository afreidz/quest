<script lang="ts">
  import session from "@/stores/session.svelte";
  import Actions from "@/components/sessions/actions.svelte";
  import CameraFeed from "@/components/sessions/camera-feed.svelte";

  let feed = $derived(session.camEnabled ? session.camera : undefined);
</script>

<div class="flex-1 size-full flex flex-col items-center justify-center">
  <header class="flex w-full justify-end items-center gap-4">
    <CameraFeed {feed} class="w-52" name={session.name} muted={session.muted} />
  </header>
  <section class="w-full flex-1 flex flex-col items-center justify-center">
    {session.status}
  </section>
  <Actions />
</div>
