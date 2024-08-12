<script lang="ts" generics="T">
  import type { Snippet } from "svelte";

  type Props = {
    items?: T[];
    title?: string;
    class?: string;
    actions?: Snippet;
    loading?: boolean;
    prelist?: Snippet;
    children?: Snippet;
    render?: Snippet<[T]>;
    location?: "left" | "right";
    max?: "sm" | "md" | "1/4" | "1/3" | "500" | "auto";
    min?: "sm" | "md" | "1/4" | "1/3" | "500" | "auto";
  };

  let {
    min,
    title,
    render,
    actions,
    loading,
    prelist,
    children,
    max = "md",
    items = [],
    location = "left",
    class: classList = "",
  }: Props = $props();

  let sizeClasses: string = $derived.by(() => {
    const classes = [];

    if (min === "1/3") classes.push("min-w-[33vw]");
    if (min === "1/4") classes.push("min-w-[25vw]");
    if (min === "sm") classes.push("min-w-[320px]");
    if (min === "md") classes.push("min-w-[448px]");
    if (min === "500") classes.push("min-w-[500px]");

    if (max === "sm") classes.push("max-w-sm");
    if (max === "md") classes.push("max-w-md");
    if (max === "1/3") classes.push("max-w-[33vw]");
    if (max === "1/4") classes.push("max-w-[25vw]");
    if (max === "500") classes.push("max-w-[500px]");

    return classes.join(" ");
  });
</script>

<div
  class:border-r={location === "left"}
  class:border-l={location === "right"}
  class="flex-1 bg-neutral flex flex-col border-neutral-200 sticky top-0 {sizeClasses}"
>
  {#if title || actions}
    <h2
      class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
    >
      {#if title}
        <span>{title}</span>
      {/if}
      {#if actions}
        {@render actions()}
      {/if}
    </h2>
  {/if}
  {#if prelist}
    {@render prelist()}
  {/if}
  <div
    class:skeleton={loading}
    class="bg-neutral rounded-none flex-1 overflow-auto {classList}"
  >
    {#if !loading}
      {#if children}
        {@render children()}
      {:else}
        {#each items as item}
          {@render render?.(item)}
        {/each}
      {/if}
    {/if}
  </div>
</div>
