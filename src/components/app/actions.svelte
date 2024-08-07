<script lang="ts">
  import type { Snippet } from "svelte";
  import { findFirstFocusableElement } from "@/utilities/dom";

  type Props = {
    class?: string;
    addTip?: string;
    addIcon?: string;
    editTip?: string;
    editIcon?: string;
    addForm?: Snippet;
    editForm?: Snippet;
    addShown?: boolean;
    deleteTip?: string;
    deleteIcon?: string;
    editShown?: boolean;
    deleteForm?: Snippet;
    deleteShown?: boolean;
    onAdd?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    size?: "xs" | "sm" | "md";
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
    onAdd,
    onEdit,
    addForm,
    onDelete,
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
    addIcon = "mdi:plus",
    editIcon = "mdi:edit-outline",
    deleteIcon = "mdi:trash-outline",
  }: Props = $props();
</script>

<div class="join">
  {#if addForm || onAdd}
    <button
      data-tip={addTip}
      class:btn-xs={size === "xs"}
      class:btn-sm={size === "sm"}
      class:btn-md={size === "md"}
      onclick={() => (onAdd ? onAdd() : (addShown = true))}
      class="btn btn-outline join-item tooltip tooltip-left tooltip-primary"
    >
      <iconify-icon
        icon={addIcon}
        class="pointer-events-none"
        class:text-xl={size === "md"}
      ></iconify-icon>
    </button>
  {/if}
  {#if editForm || onEdit}
    <button
      data-tip={editTip}
      class:btn-xs={size === "xs"}
      class:btn-sm={size === "sm"}
      class:btn-md={size === "md"}
      onclick={() => (onEdit ? onEdit() : (editShown = true))}
      class="btn btn-outline join-item tooltip tooltip-left tooltip-primary"
    >
      <iconify-icon
        icon={editIcon}
        class="pointer-events-none"
        class:text-xl={size === "md"}
      ></iconify-icon>
    </button>
  {/if}
  {#if deleteForm || onDelete}
    <button
      data-tip={deleteTip}
      class:btn-xs={size === "xs"}
      class:btn-sm={size === "sm"}
      class:btn-md={size === "md"}
      onclick={() => (onDelete ? onDelete() : (deleteShown = true))}
      class="btn btn-outline join-item tooltip tooltip-left tooltip-primary hover:bg-error hover:text-neutral-950"
    >
      <iconify-icon
        icon={deleteIcon}
        class="pointer-events-none"
        class:text-xl={size === "md"}
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
