<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    icon?: string;
    class?: string;
    pull?: Snippet;
    border?: boolean;
    subText?: Snippet;
    children?: Snippet;
  };

  let {
    icon,
    pull,
    subText,
    children,
    border = true,
    class: className,
  }: Props = $props();
</script>

<header
  class:border-b={border}
  class="flex items-center gap-2 p-3 pb-2 border-neutral-200 {className ?? ''}"
>
  <iconify-icon class="text-xl m-2 flex-none self-start" {icon}></iconify-icon>
  <div class="flex-1 max-w-none text-xl leading-relaxed font-bold">
    <h3>{@render children?.()}</h3>
    <p class="text-sm text-neutral-400 mt-1">
      {@render subText?.()}
    </p>
  </div>
  <div class="flex-none">
    {@render pull?.()}
  </div>
</header>
