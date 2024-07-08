<script context="module" lang="ts">
  const defaultConfirmValue = "confirm";

  export { defaultConfirmValue };
</script>

<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    open?: Boolean;
    class?: string;
    title?: string;
    error?: Boolean;
    children: Snippet;
    placeholder?: string;
    confirmText?: string;
    onclose?: (s?: string) => void;
    elm?: HTMLDialogElement | null;
  };

  let confirmTextValue: string = $state("");

  let {
    onclose,
    children,
    confirmText,
    placeholder,
    error = true,
    open = false,
    elm = $bindable(),
    class: className = "",
    title = "Are you sure?",
  }: Props = $props();

  $effect(() => {
    if (open && elm) elm.showModal();
  });
</script>

<dialog class="modal text-neutral-950" bind:this="{elm}" onclose="{() => onclose?.(elm?.returnValue)}">
  <form
    method="dialog"
    class="modal-box bg-neutral {className ?? ''}"
    on:submit|preventDefault="{() =>
      elm?.close(
        confirmText && confirmTextValue === confirmText
          ? confirmText
          : confirmText && confirmTextValue !== confirmText
            ? ''
            : defaultConfirmValue
      )}"
  >
    <h3 class="font-bold text-lg">{title}</h3>
    <div class="prose max-w-none">
      <p>
        {@render children()}
      </p>
      {#if confirmText}
        <p>
          <label>
            <input
              required
              type="text"
              class:input-error="{error}"
              id="confirm_delete_client"
              bind:value="{confirmTextValue}"
              class="input input-error w-full max-w-xs bg-base-100/10"
              placeholder="{placeholder !== undefined
                ? placeholder
                : `Type "${confirmText}" to confirm`}"
            />
          </label>
        </p>
      {/if}
    </div>
    <div class="modal-action">
      <button value="confirm" class="btn btn-ghost">Ok</button>
      <button
        value="cancel"
        formmethod="dialog"
        on:click|preventDefault="{() => elm?.close()}"
        class="btn btn-secondary text-neutral">Close</button
      >
    </div>
  </form>
</dialog>
