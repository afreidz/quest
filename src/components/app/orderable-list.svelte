<script lang="ts" generics="T extends { id: string, position: number | null, [k: string]: any }">
  import clone from "@/utilities/clone";
  import { type Snippet } from "svelte";

  type Props = {
    items: T[];
    class?: string;
    enabled?: boolean;
    itemClass?: string;
    render: Snippet<[T]>;
    onUpdate?: (t: T[]) => void;
  };

  let {
    items,
    render,
    onUpdate,
    enabled = true,
    itemClass = "",
    class: classList = "",
  }: Props = $props();

  let elms: HTMLElement[] = $state([]);
  let handleClicked: boolean = $state(false);
  let container: HTMLElement | null = $state(null);
  let draggedElement: HTMLElement | null = $state(null);

  const down = (e: PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target?.classList.contains("handle")) handleClicked = true;
  };

  const drag = (e: DragEvent) => {
    const target = e.target as HTMLElement;
    if (!target || !handleClicked) return e.preventDefault();

    const elm = elms.find((elm) => isChild(target, elm));
    if (elm) draggedElement = elm;
    handleClicked = false;
  };

  const over = (e: DragEvent) => {
    e.preventDefault();
    if (!draggedElement) return;

    const target = e.target as HTMLElement;
    const elm = elms.find((elm) => isChild(target, elm));

    if (elm && elm !== draggedElement) {
      const bounding = target.getBoundingClientRect();
      const offset = bounding.y + bounding.height / 2;
      container?.insertBefore(
        draggedElement,
        e.clientY - offset > 0 ? elm.nextSibling : elm
      );
    }
  };

  const drop = (e: DragEvent) => {
    e.preventDefault();
    draggedElement = null;
    if (!container) return;
    const updated = clone(Array.from(container.children)
      .map((e, i) => {
        const elm = e as HTMLElement;
        const item = items.find((i) => i.id === elm.dataset["itemId"]);
        if (item) item.position = i+1;
        return item;
      })
      .filter((e) => e !== undefined));

    const sameOrder = updated.map((i) => i.id).every((id,i) => items[i].id === id);
    if(!sameOrder) {
      onUpdate?.(updated);
      items = updated;
    }
  };

  const end = () => {
    draggedElement = null;
  };

  function isChild(c: HTMLElement, p: HTMLElement) {
    let currentElement: HTMLElement | null = c;

    while (currentElement) {
      if (currentElement === p) return true;
      currentElement = currentElement.parentElement;
    }

    return false;
  }
</script>

<ul
  class="{classList}"
  bind:this="{container}"
  ondrop="{enabled ? drop : undefined}"
  ondragend="{enabled ? end : undefined}"
  ondragover="{enabled ? over : undefined}"
  ondragstart="{enabled ? drag : undefined}"
  onpointerdown="{enabled ? down : undefined}"
>
  {#each items as item, i (item.id)}
    <li
      class="{itemClass}"
      bind:this="{elms[i]}"
      draggable="{enabled}"
      data-item-id="{item.id}"
    >
      {@render render(item)}
    </li>
  {/each}
</ul>
