<script lang="ts">
  type Props = {
    icon?: string;
    class?: string;
  };

  let { icon, class: className }: Props = $props();
</script>

<header
  class="flex items-center gap-2 pb-4 border-b border-neutral-300 border-dotted {className ??
    ''}"
>
  <iconify-icon class="text-2xl mt-1 flex-none self-start" {icon}
  ></iconify-icon>
  <div class="prose flex-1 max-w-none">
    <h3 class="mb-1"><slot /></h3>
    <p class="text-sm text-neutral-400">
      <slot name="sub" />
    </p>
  </div>
  <div class="flex-none">
    <slot name="pull" />
  </div>
</header>
