<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<any> & {
    value: string;
    class?: string;
    enabled?: boolean;
    onUpdate?: (s: string) => void;
    as: keyof HTMLElementTagNameMap;
    size?: "xs" | "sm" | "md" | "lg";
  };

  let {
    as,
    value,
    onUpdate,
    size = "md",
    enabled = true,
    class: classList = "",
    ...rest
  }: Props = $props();

  let editing: boolean = $state(false);
  let currentValue: string = $state(value);
  let input: HTMLInputElement | null = $state(null);

  $effect(() => {
    if (editing && input) input.focus();
  });

  function update() {
    editing = false;
    onUpdate?.(currentValue);
  }
</script>

{#if editing}
  <label class="flex items-center gap-2">
    <input
      type="text"
      onblur="{update}"
      bind:this="{input}"
      bind:value="{currentValue}"
      class="input bg-base-100/10 w-full"
      class:input-xs="{size === 'xs'}"
      class:input-sm="{size === 'sm'}"
      class:input-md="{size === 'md'}"
      class:input-lg="{size === 'lg'}"
    />
    <button
      onclick="{update}"
      class="btn btn-outline"
      class:btn-xs="{size === 'xs'}"
      class:btn-sm="{size === 'sm'}"
      class:btn-md="{size === 'md'}"
      class:btn-lg="{size === 'lg'}"
    >
      {#if currentValue === value}
        <iconify-icon icon="mdi:close"></iconify-icon>
      {:else}
        <iconify-icon icon="mdi:check"></iconify-icon>
      {/if}
    </button>
  </label>
{:else}
  <svelte:element
    this="{as}"
    class="flex items-center gap-1 {classList}"
    {...rest}
  >
    {value}
    {#if enabled}
      <button
        class="btn btn-ghost text-neutral-300 hover:text-neutral-950"
        class:btn-xs="{size === 'xs'}"
        class:btn-sm="{size === 'sm'}"
        class:btn-md="{size === 'md'}"
        class:btn-lg="{size === 'lg'}"
        onclick="{() => (editing = true)}"
      >
        <iconify-icon icon="mdi:pencil-outline"></iconify-icon>
      </button>
    {/if}
  </svelte:element>
{/if}
