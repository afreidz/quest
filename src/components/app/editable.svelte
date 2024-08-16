<script lang="ts">
  import { preventDefault } from "@/utilities/events";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<any> & {
    class?: string;
    enabled?: boolean;
    value?: string | null;
    editAs?: "input" | "textarea";
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
    editAs = "input",
    class: classList = "",
    ...rest
  }: Props = $props();

  let editing: boolean = $state(false);
  let form: HTMLFormElement | null = $state(null);
  let currentValue: string | undefined | null = $state(value);
  let originalValue: string | undefined | null = $state(value);
  let input: HTMLInputElement | HTMLTextAreaElement | null = $state(null);

  $effect(() => {
    if (value) currentValue = value;
    if (value) originalValue = value;
  });

  $effect(() => {
    if (editing && input) input.focus();
  });

  function update() {
    editing = false;
    if (currentValue === originalValue) return;
    onUpdate?.(currentValue ?? "");
  }
</script>

{#if editing}
  <dialog open class="contents appearance-none">
    <form
      method="dialog"
      bind:this={form}
      onsubmit={preventDefault(update)}
      onreset={preventDefault(() => (editing = false))}
    >
      <label class="flex items-center gap-3">
        {#if editAs === "textarea"}
          <textarea
            onblur={update}
            bind:this={input}
            bind:value={currentValue}
            class:input-xs={size === "xs"}
            class:input-sm={size === "sm"}
            class:input-md={size === "md"}
            class:input-lg={size === "lg"}
            class="textarea leading-normal bg-base-100/10 flex-1 min-h-20 min-w-72"
            onkeydown={(e: KeyboardEvent) => {
              if (e.key === "Escape" && form) form.reset();
            }}
          ></textarea>
        {:else}
          <input
            type="text"
            onblur={update}
            bind:this={input}
            bind:value={currentValue}
            class:input-xs={size === "xs"}
            class:input-sm={size === "sm"}
            class:input-md={size === "md"}
            class:input-lg={size === "lg"}
            class="input bg-base-100/10 w-full"
            onkeydown={(e: KeyboardEvent) => {
              if (e.key === "Escape" && form) form.reset();
            }}
          />
        {/if}
        <button
          type="submit"
          class="btn btn-outline"
          class:btn-xs={size === "xs"}
          class:btn-sm={size === "sm"}
          class:btn-md={size === "md"}
          class:btn-lg={size === "lg"}
        >
          {#if currentValue === value}
            <iconify-icon icon="mdi:close"></iconify-icon>
          {:else}
            <iconify-icon icon="mdi:check"></iconify-icon>
          {/if}
        </button>
      </label>
    </form>
  </dialog>
{:else}
  <svelte:element
    this={as}
    {...rest}
    tabindex={enabled && -1}
    role={enabled && "button"}
    class="flex items-center gap-1 group {classList}"
    onclick={() => {
      if (enabled) editing = true;
    }}
  >
    {value ?? "Click to edit"}
    {#if enabled}
      <button
        value="confirm"
        class="btn btn-ghost transition-colors invisible group-hover:visible text-neutral-400 hover:!text-neutral-950"
        class:btn-xs={size === "xs"}
        class:btn-sm={size === "sm"}
        class:btn-md={size === "md"}
        class:btn-lg={size === "lg"}
        onclick={() => (editing = true)}
      >
        <iconify-icon icon="mdi:pencil-outline"></iconify-icon>
      </button>
    {/if}
  </svelte:element>
{/if}
