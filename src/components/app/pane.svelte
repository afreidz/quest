<script lang="ts" generics="T">
  import { type Snippet } from "svelte";

  type Props = {
    items?: T[];
    min?: number;
    title?: string;
    class?: string;
    actions?: Snippet;
    loading?: boolean;
    prelist?: Snippet;
    postlist?: Snippet;
    children?: Snippet;
    collapsed?: boolean;
    collapsable?: boolean;
    render?: Snippet<[T]>;
    location?: "left" | "right";
    as?: keyof HTMLElementTagNameMap;
    size?: "sm" | "md" | "lg" | "1/4" | "1/3" | "auto";
  };

  let {
    min,
    title,
    render,
    actions,
    loading,
    prelist,
    postlist,
    children,
    items = [],
    as = "div",
    size = "md",
    location = "left",
    collapsable = false,
    class: classList = "",
    collapsed = $bindable(false),
  }: Props = $props();

  $effect(() => {
    if (!collapsable) collapsed = false;
  });
</script>

{#snippet collapseBtn()}
  <button
    class:mt-4={collapsed}
    onclick={() => (collapsed = !collapsed)}
    class:tooltip-right={location === "left"}
    class:tooltip-left={location === "right"}
    class="tooltip btn btn-sm btn-ghost m-1 tooltip-primary"
    data-tip={`${collapsed ? "Expand" : "Collapse"} ${title ?? ""}`}
  >
    <iconify-icon
      icon="mdi:chevron-double-left"
      class:rotate-180={(location === "right" && !collapsed) ||
        (location === "left" && collapsed)}
    ></iconify-icon>
  </button>
{/snippet}

<svelte:element
  this={as}
  class:w-14={collapsed}
  class:w-full={!collapsed}
  class:bottom-0={!collapsed}
  class:max-w-sm={size === "sm"}
  class:max-w-md={size === "md"}
  class:max-w-lg={size === "lg"}
  class:max-w-third={size === "1/3"}
  class:max-w-quarter={size === "1/4"}
  class:border-r={location === "left"}
  class:border-l={location === "right"}
  class:top-0={collapsable && !collapsed}
  class:absolute={collapsable && !collapsed}
  style={min && !collapsed ? "min-width: " + min + "px;" : ""}
  class:left-0={collapsable && !collapsed && location === "left"}
  class:right-0={collapsable && !collapsed && location === "right"}
  class="bg-neutral border-neutral-200 transition-all duration-200 2xl:static ease-in-out flex-none flex flex-col z-10"
>
  {#if collapsable && collapsed}
    {@render collapseBtn()}
  {/if}
  {#if (title || actions) && !collapsed}
    <h2
      class:pl-2={collapsable}
      class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
    >
      {#if collapsable}
        {@render collapseBtn()}
      {/if}
      {#if title}
        <span class="flex-1 line-clamp-1">{title}</span>
      {/if}
      {#if actions}
        {@render actions()}
      {/if}
    </h2>
  {/if}
  {#if !collapsed}
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
    {#if postlist}
      {@render postlist()}
    {/if}
  {/if}
</svelte:element>

<!-- <div
  class:min-w-sm={min === "sm"}
  class:min-w-md={min === "md"}
  class:max-w-sm={max === "sm"}
  class:max-w-md={max === "md"}
  class:min-w-third={min === "1/3"}
  class:max-w-third={max === "1/3"}
  class:min-w-quarter={min === "1/4"}
  class:max-w-quarter={max === "1/4"}
  class:border-r={location === "left"}
  class:border-l={location === "right"}
  class="@container flex-1 bg-neutral flex flex-col border-neutral-200 sticky top-0"
>
  <div
    class:@sm:w-full={min === "sm"}
    class:@md:w-full={min === "md"}
    class:@third:w-full={min === "1/3"}
    class:@quarter:w-full={min === "1/4"}
    class="w-10"
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
</div> -->
