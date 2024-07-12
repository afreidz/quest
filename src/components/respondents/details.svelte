<script lang="ts">
  import Meta from "./meta.svelte";
  import { actions } from "astro:actions";
  import List from "./respondent-system-list.svelte";
  import type { RespondentFromAll } from "@/actions/respondents";

  type Props = {
    respondent: string;
  };

  let respondent: RespondentFromAll | null = $state(null);

  $effect(() => {
    if (respondentId && !respondent) refreshRespondent();
  });

  async function refreshRespondent() {
    respondent = await actions.respondents.getById(respondentId);
  }

  let { respondent: respondentId }: Props = $props();
</script>

<div
  class:skeleton="{!respondent}"
  class="min-w-80 max-w-80 bg-neutral flex flex-col border-neutral-200 border-r sticky top-0"
>
  {#if respondent}
    <Meta {respondent} />
  {/if}
</div>
<div class="p-4 w-full flex justify-center">
  {#if respondent}
    <div class="flex flex-col items-stretch w-[900px]">
      <List {respondent} />
    </div>
  {/if}
</div>
