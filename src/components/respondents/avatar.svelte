<script lang="ts">
  import type { SystemFromAll } from "@/actions/systems";
  import type { RespondentFromAll } from "@/actions/respondents";

  type Props = {
    size?: number;
    respondent: SystemFromAll["respondents"][number] | RespondentFromAll;
  };

  let { respondent, size = 40 }: Props = $props();
</script>

<div class:placeholder={!respondent.imageURL} class="avatar flex-none">
  <div
    class="@container bg-secondary text-secondary-content rounded-full"
    style="width: {size}px; height: {size}px;}"
  >
    {#if respondent.imageURL}
      <img src={respondent.imageURL} alt={respondent.email} />
    {:else}
      <span class="text-[50cqi]"
        >{respondent.email.charAt(0).toLocaleUpperCase()}</span
      >
    {/if}
  </div>
</div>
