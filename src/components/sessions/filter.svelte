<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import Pane from "@/components/app/pane.svelte";
  import type { Clients } from "@/actions/clients";
  import type { Systems } from "@/actions/systems";
  import { preventDefault } from "@/utilities/events";
  import type { SessionQuery } from "@/actions/sessions";
  import type { Respondents } from "@/actions/respondents";

  type Props = {
    filters: SessionQuery;
    onsubmit?: (i?: any) => void;
    oncancel?: (i?: any) => void;
  };

  type ToggleFilters = keyof Pick<
    SessionQuery,
    "clients" | "respondents" | "systems"
  >;

  let loading = $state(true);
  let clients: Clients = $state([]);
  let systems: Systems = $state([]);
  let respondents: Respondents = $state([]);
  let { filters = $bindable({}), onsubmit, oncancel }: Props = $props();

  onMount(async () => {
    clients = (await actions.client.getAll({})).data ?? [];
    systems = (await actions.system.getAll({})).data ?? [];
    respondents = (await actions.respondents.getAll({})).data ?? [];
    loading = false;
  });

  function toggleFilter(id: string, type: ToggleFilters) {
    let filter = filters[type];

    if (!filter) filter = [];

    const ids = filter.includes(id)
      ? filter.filter((item) => item !== id)
      : [...filter, id];

    filters = { ...filters, [type]: ids };
  }
</script>

<form
  class:skeleton={loading}
  onsubmit={preventDefault(() => onsubmit?.())}
  class="flex-1 border rounded-box overflow-auto flex bg-base-100/5"
>
  {#if !loading}
    <Pane
      static
      size="sm"
      collapsable
      items={clients}
      actions={clientTotals}
      class="!bg-base-100/10"
      title="Filter by client"
      render={renderClientFilter}
      collapseContent={clientTotalsCollapsed}
    />
    <Pane
      static
      size="sm"
      collapsable
      items={systems}
      actions={systemTotals}
      class="!bg-base-100/10"
      title="Filter by systems"
      render={renderSystemFilter}
      collapseContent={systemTotalsCollapse}
    />
    <Pane
      static
      size="sm"
      collapsable
      items={respondents}
      class="!bg-base-100/10"
      actions={respondentTotals}
      title="Filter by respondents"
      render={renderRespondentFilter}
      collapseContent={respondentTotalsCollapse}
    />
  {/if}
  <div class="p-3 px-4 flex flex-col flex-1 font-normal max-w-screen-sm">
    <header
      class="text-base font-semibold flex justify-between opacity-50 mb-4"
    >
      Include sessions that...
    </header>
    <div class="form-control">
      <label class="label cursor-pointer">
        <span class="label-text w-48">Were moderated by</span>
        <input
          type="email"
          bind:value={filters.moderator}
          class="input input-bordered bg-neutral input-sm max-w-none flex-1"
        />
      </label>
    </div>
    <div class="form-control w-56">
      <label class="label cursor-pointer">
        <span class="label-text">Are incompleted</span>
        <input
          type="checkbox"
          bind:checked={filters.incomplete}
          class="checkbox checkbox-primary"
        />
      </label>
    </div>
    <div class="form-control w-56">
      <label class="label cursor-pointer">
        <span class="label-text">Has NO recordings</span>
        <input
          type="checkbox"
          class="checkbox checkbox-primary"
          bind:checked={filters.hasNoRecordings}
        />
      </label>
    </div>
    <div class="form-control w-56">
      <label class="label cursor-pointer">
        <span class="label-text">Has NO transcripts</span>
        <input
          type="checkbox"
          class="checkbox checkbox-primary"
          bind:checked={filters.hasNoTranscripts}
        />
      </label>
    </div>
    <footer class="flex-1 flex items-end justify-end gap-2">
      <button onclick={oncancel} class="btn btn-ghost">Cancel</button>
      <button type="submit" class="btn btn-primary">Search</button>
    </footer>
  </div>
</form>

{#snippet renderClientFilter(client: Clients[number])}
  {@render renderFilter(
    client.id,
    client.name,
    filters.clients?.includes(client.id) ?? false,
    "clients",
  )}
{/snippet}

{#snippet renderSystemFilter(system: Systems[number])}
  {@render renderFilter(
    system.id,
    system.title,
    filters.systems?.includes(system.id) ?? false,
    "systems",
  )}
{/snippet}

{#snippet renderRespondentFilter(respondent: Respondents[number])}
  {@render renderFilter(
    respondent.id,
    respondent.name || respondent.email,
    filters.respondents?.includes(respondent.id) ?? false,
    "respondents",
  )}
{/snippet}

{#snippet renderFilter(
  id: string,
  text: string,
  checked: boolean,
  type: ToggleFilters,
)}
  <label
    class:highlight={checked}
    class="skip-focus btn btn-primary bg-neutral btn-lg btn-outline rounded-none w-full text-left border-neutral-200 border-t-0 border-r-0 border-l-0 flex"
  >
    <span class="flex-1">{text}</span>
    <input
      {checked}
      type="checkbox"
      class="checkbox checkbox-primary skip-focus"
      onchange={() => toggleFilter(id, type)}
    />
  </label>
{/snippet}

{#snippet clientTotals()}
  {#if filters.clients?.length}
    <span class="badge glass">{filters.clients.length} selected</span>
  {/if}
{/snippet}

{#snippet clientTotalsCollapsed()}
  {#if filters.clients?.length}
    <span class="badge glass">{filters.clients.length}</span>
  {/if}
{/snippet}

{#snippet systemTotals()}
  {#if filters.systems?.length}
    <span class="badge glass">{filters.systems.length} selected</span>
  {/if}
{/snippet}

{#snippet systemTotalsCollapse()}
  {#if filters.systems?.length}
    <span class="badge glass">{filters.systems.length}</span>
  {/if}
{/snippet}

{#snippet respondentTotals()}
  {#if filters.respondents?.length}
    <span class="badge glass">{filters.respondents.length} selected</span>
  {/if}
{/snippet}

{#snippet respondentTotalsCollapse()}
  {#if filters.respondents?.length}
    <span class="badge glass">{filters.respondents.length}</span>
  {/if}
{/snippet}
