<script lang="ts">
  import type { Snippet } from "svelte";
  import { findFirstFocusableElement } from "@/utilities/dom";

  type Props = {
    size?: "xs" | "sm";
    addForm?: Snippet;
    editForm?: Snippet;
    deleteForm?: Snippet;
    addShown?: boolean;
    editShown?: boolean;
    deleteShown?: boolean;
    addTip?: string;
    editTip?: string;
    deleteTip?: string;
    class?: string;
  };

  let addDialog: HTMLDialogElement | null = $state(null);
  let editDialog: HTMLDialogElement | null = $state(null);
  let deleteDialog: HTMLDialogElement | null = $state(null);

  $effect(() => {
    if (addShown && addDialog) {
      addDialog.showModal();
      findFirstFocusableElement(addDialog, [
        ".close-button",
        ".skip-focus",
      ])?.focus();
    } else if (!addShown && addDialog) {
      addDialog.close();
    }
  });

  $effect(() => {
    if (editShown && editDialog) {
      editDialog.showModal();
      findFirstFocusableElement(editDialog, [
        ".close-button",
        ".skip-focus",
      ])?.focus();
    } else if (!editShown && editDialog) {
      editDialog.close();
    }
  });

  $effect(() => {
    if (deleteShown && deleteDialog) {
      deleteDialog.showModal();
      findFirstFocusableElement(deleteDialog, [
        ".close-button",
        ".skip-focus",
      ])?.focus();
    } else if (!deleteShown && deleteDialog) {
      deleteDialog.close();
    }
  });

  let {
    addForm,
    editForm,
    deleteForm,
    size = "sm",
    addTip = "Add",
    editTip = "Edit",
    deleteTip = "Delete",
    class: classList = "",
    addShown = $bindable(false),
    editShown = $bindable(false),
    deleteShown = $bindable(false),
  }: Props = $props();
</script>

<div class="join">
  {#if addForm}
    <button
      data-tip={addTip}
      class:btn-xs={size === "xs"}
      class:btn-sm={size === "sm"}
      onclick={() => (addShown = true)}
      class="btn btn-outline join-item tooltip tooltip-left tooltip-primary"
    >
      <iconify-icon icon="mdi:plus" class="pointer-events-none"></iconify-icon>
    </button>
  {/if}
  {#if editForm}
    <button
      data-tip={editTip}
      class:btn-xs={size === "xs"}
      class:btn-sm={size === "sm"}
      onclick={() => (editShown = true)}
      class="btn btn-outline join-item tooltip tooltip-left tooltip-primary"
    >
      <iconify-icon icon="mdi:edit-outline" class="pointer-events-none"
      ></iconify-icon>
    </button>
  {/if}
  {#if deleteForm}
    <button
      data-tip={deleteTip}
      class:btn-xs={size === "xs"}
      class:btn-sm={size === "sm"}
      onclick={() => (deleteShown = true)}
      class="btn btn-outline join-item tooltip tooltip-left tooltip-primary hover:bg-error hover:text-neutral-950"
    >
      <iconify-icon icon="mdi:trash-outline" class="pointer-events-none"
      ></iconify-icon>
    </button>
  {/if}
</div>

{#if deleteForm}
  <dialog
  class="modal"
  bind:this={deleteDialog}
    onclose={() => (deleteShown = false)}
  >
    <div class="modal-box bg-neutral {classList}">
      <h3 class="font-bold text-lg flex items-center justify-between gap-3">
        {deleteTip}
        <form method="dialog">
          <button class="close-button btn btn-sm btn-circle btn-ghost mb-3"
            >✕</button
          >
        </form>
      </h3>
      {@render deleteForm()}
    </div>
  </dialog>
{/if}

{#if editForm}
  <dialog
  class="modal"
  bind:this={editDialog}
    onclose={() => (editShown = false)}
  >
    <div class="modal-box bg-neutral {classList}">
      <h3 class="font-bold text-lg flex items-center justify-between gap-3">
        {editTip}
        <form method="dialog">
          <button class="close-button btn btn-sm btn-circle btn-ghost mb-3"
            >✕</button
          >
        </form>
      </h3>
      {@render editForm()}
    </div>
  </dialog>
{/if}

{#if addForm}
  <dialog
  class="modal"
  bind:this={addDialog}
    onclose={() => (addShown = false)}
  >
    <div class="modal-box bg-neutral {classList}">
      <h3 class="font-bold text-lg flex items-center justify-between gap-3">
        {addTip}
        <form method="dialog">
          <button class="close-button btn btn-sm btn-circle btn-ghost mb-3"
            >✕</button
          >
        </form>
      </h3>
      {@render addForm()}
    </div>
  </dialog>
{/if}
