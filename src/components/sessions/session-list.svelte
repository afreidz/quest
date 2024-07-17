<script lang="ts">
  import store from "@/stores/global.svelte";
  import { preventDefault } from "@/utilities/events";

  let loading = $state(false);
</script>

<div
  class="min-w-80 max-w-md w-1/3 bg-neutral flex flex-col border-neutral-200 border-r sticky top-0"
>
  <h2
    class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
  >
    <span>Sessions</span>
    <!-- <button
      onclick="{() => (showNewDialog = true)}"
      class="btn btn-sm btn-ghost"
    >
      <iconify-icon class="text-xl" icon="ic:baseline-plus"></iconify-icon>
    </button> -->
  </h2>
  <form class="p-3 flex-none border-neutral-200 border-b">
    <span class="block mb-2 font-semibold">Filters</span>
    <!-- <div class="flex items-center gap-3">
      <label class="form-control flex-1">
        <select
          bind:value="{client}"
          class="select select-bordered bg-neutral select-sm"
        >
          <option value="{null}">Client...</option>
          {#each clients.all as client}
            <option value="{client.id}">{client.name}</option>
          {/each}
        </select>
      </label>
      <div class="join">
        <input
          type="checkbox"
          aria-label="Checklists"
          bind:checked="{includeChecklists}"
          class="join-item btn btn-sm btn-neutral border border-neutral-300"
        />
        <input
          type="checkbox"
          aria-label="Surveys"
          bind:checked="{includeSurveys}"
          class="join-item btn btn-sm btn-neutral border border-neutral-300"
        />
      </div>
    </div> -->
  </form>
  <div
    class:skeleton={loading}
    class="bg-neutral rounded-none flex-1 overflow-auto"
  >
    {#if !loading}
      <!-- {#each sessions.all as session}
        <a
          href="{`#${session.id}`}"
          data-tip="{'You have unsaved changes to the current session!'}"
          class:tooltip="{sessions.activeDirty}"
          class:highlight="{sessions.active?.id === session.id}"
          onclick="{preventDefault(() => sessions.setActive(session))}"
          class="btn btn-primary btn-lg btn-outline rounded-none w-full tooltip-error tooltip-top first:tooltip-bottom tooltip-b text-left border-neutral-200 border-t-0 border-r-0 border-l-0 !h-auto px-4 py-4"
        >
          <div class="flex flex-1 items-center justify-start gap-4">
            <div class="flex-none flex justify-center">
              <iconify-icon class="text-neutral-400" icon="ri:survey-line"
              ></iconify-icon>
            </div>
            <div class="flex flex-col gap-2 flex-1">
              <div class="flex items-center gap-2">
                <span class="badge badge-primary">{session}</span>
                <span class="badge badge-secondary">{session}</span>
              </div>
              <strong class="font-semibold">Session with {session}</strong>
              <small class="text-xs text-neutral-400">{session}</small>
            </div>
          </div>
        </a>
      {/each} -->
    {/if}
  </div>
</div>

<style lang="postcss">
  .highlight {
    @apply bg-secondary/30 border-l-4 border-l-secondary;
  }
</style>
