<script lang="ts">
  import Avatar from "./avatar.svelte";
  import type { RespondentFromAll } from "@/actions/respondents";

  type Props = {
    respondent: RespondentFromAll;
  };

  let { respondent }: Props = $props();
</script>

<aside class="p-4 flex flex-col items-center gap-4">
  <Avatar {respondent} size={100} />
  <h2 class="font-extralight text-xl flex flex-col">
    {respondent.name ?? respondent.email}
    <small class="uppercase font-bold opacity-40 text-xs"
      >{respondent.title}</small
    >
  </h2>
  <p class="prose">{respondent.profile}</p>
  <div class="flex justify-between w-full">
    <p class="prose">
      <strong>{respondent.systems.length}</strong>
      <span>systems</span>
    </p>
    <p class="prose">
      <strong>{respondent.revisions.length}</strong>
      <span>revisions</span>
    </p>
    <p class="prose">
      <strong>{respondent.responses.length}</strong>
      <span>responses</span>
    </p>
  </div>
</aside>
