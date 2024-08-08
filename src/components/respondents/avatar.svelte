<script lang="ts">
  type Respondent = { imageURL: string | null; email: string };
  interface IRespondent extends Respondent {}

  type Props = {
    tip?: string;
    size?: number;
    class?: string;
    respondent: IRespondent;
  };

  let { tip, respondent, size = 40, class: className = "" }: Props = $props();
</script>

<div
  data-tip={tip}
  class:tooltip={!!tip}
  class="avatar flex-none {className}"
  class:placeholder={!respondent.imageURL}
>
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
