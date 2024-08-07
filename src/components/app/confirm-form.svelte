<script lang="ts" context="module">
  export const DEFAULT_CONFIRM_TEXT = "YES";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { preventDefault } from "@/utilities/events";

  type Props = {
    class?: string;
    error?: Boolean;
    children: Snippet;
    placeholder?: string;
    confirmText?: string;
    onsubmit?: (s?: string) => void;
  };

  let confirmTextValue: string = $state("");

  let {
    children,
    onsubmit,
    placeholder,
    error = true,
    class: className = "",
    confirmText = DEFAULT_CONFIRM_TEXT,
  }: Props = $props();

  function handleSumbit() {
    onsubmit?.(confirmTextValue);
    confirmTextValue = "";
  }
</script>

<form
  method="dialog"
  class={className ?? ""}
  onsubmit={preventDefault(handleSumbit)}
>
  <div class="prose max-w-none font-normal">
    <p>
      {@render children()}
    </p>
    {#if confirmText}
      <p>
        <label>
          <input
            required
            type="text"
            class:input-error={error}
            id="confirm_delete_client"
            bind:value={confirmTextValue}
            class="input input-error w-full max-w-xs bg-base-100/10"
            placeholder={placeholder !== undefined
              ? placeholder
              : `Type "${confirmText}" to confirm`}
          />
        </label>
      </p>
    {/if}
  </div>
  <div class="modal-action">
    <button type="submit" class="btn btn-ghost">Ok</button>
    <button
      onclick={preventDefault(handleSumbit)}
      class="btn btn-secondary text-neutral">Cancel</button
    >
  </div>
</form>
