<script lang="ts">
  import { onMount } from "svelte";
  import store from "@/stores/global.svelte";
  import Scores from "@/components/systems/scores.svelte";
  import Customize from "@/components/app/customize.svelte";
  import RevisionList from "@/components/systems/revision-list.svelte";
  import QuestionList from "@/components/surveys/question-list.svelte";
  import ChecklistRadar from "@/components/surveys/checklist-radar.svelte";
  import RespondentList from "@/components/systems/respondent-list.svelte";

  type Props = {
    clientId: string;
    systemId: string;
  };

  let { clientId, systemId }: Props = $props();

  onMount(async () => {
    await store.refreshAllClients();
    const client = store.clients.all.find((c) => c.id === clientId);
    store.setActiveClient(client ?? null);
    await store.refreshAllSystems();
    const system = store.systems.all.find((s) => s.id === systemId);
    store.setActiveSystem(system ?? null);
    await store.refreshAllRevisions();
  });
</script>

<RevisionList />
<div class="flex-1 p-4 overflow-auto">
  <section class="flex flex-col m-auto gap-6 w-full max-w-[1000px]">
    <RespondentList />
    <QuestionList survey="{store.revisions.active?.survey}" detailed />
  </section>
</div>
{#if store.revisions.all.length}
  <div class="bg-neutral flex flex-col max-w-md border-l w-full flex-1">
    <ChecklistRadar />
    <Scores />
    <div class="px-4">
      <Customize />
    </div>
  </div>
{/if}
