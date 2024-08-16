<script lang="ts">
  import clone from "@/utilities/clone";
  import { actions } from "astro:actions";
  import messagesSvelte from "@/stores/messages.svelte";
  import Editable from "@/components/app/editable.svelte";
  import type { SessionFromAll } from "@/actions/sessions";
  import CardHeader from "@/components/app/card-header.svelte";

  type Props = {
    class?: string;
    session: SessionFromAll;
  };

  let loading = $state(false);
  let { session, class: className = "" }: Props = $props();

  let moments = $derived.by(() => {
    return clone(session).moments.sort((a, b) => {
      const timeA = a.time.split(":").map(Number);
      const timeB = b.time.split(":").map(Number);

      const dateA = new Date(0, 0, 0, timeA[0], timeA[1], timeA[2]);
      const dateB = new Date(0, 0, 0, timeB[0], timeB[1], timeB[2]);

      return +dateA - +dateB;
    });
  });

  async function deleteMoment(id: string) {
    loading = true;

    const resp = await actions.sessions.deleteMoment(id);

    loading = false;

    if (resp.error) {
      messagesSvelte.error("Unable to delete moment", resp.error);
    }

    session = (await actions.sessions.getById(session.id)).data ?? session;
  }

  async function updateMoment(id: string, text: string) {
    loading = true;

    const resp = await actions.sessions.updateMomentText({
      text,
      moment: id,
    });

    loading = false;

    if (resp.error) {
      messagesSvelte.error("Unable to update moment", resp.error);
    }

    session = (await actions.sessions.getById(session.id)).data ?? session;
  }
</script>

<div class:skeleton={loading} class="realative {className}">
  <CardHeader
    icon="mdi:lightbulb-on-outline"
    class="sticky top-0 left-0 right-0 border-t bg-neutral flex-none z-[1]"
    >Key Moments</CardHeader
  >
  <div class="flex-1 m-2">
    {#if !loading}
      <ul class="timeline timeline-vertical">
        {#each moments as moment, i}
          <li class="group" style="grid-template-columns: 90px 20px auto;">
            {#if i !== 0}
              <hr class="bg-base-100/30" />
            {/if}
            <div class="timeline-start text-xs flex items-center gap-2">
              <button
                data-tip="Delete moment"
                onclick={() => deleteMoment(moment.id)}
                class="btn btn-xs btn-ghost tooltip tooltip-primary tooltip-right transition-opacity opacity-0 group-hover:opacity-100"
              >
                <iconify-icon icon="mdi:ban" class="text-error text-base"
                ></iconify-icon>
              </button>
              <span>{moment.time}</span>
            </div>
            <div class="timeline-middle">
              <iconify-icon class="text-base-100 text-xs" icon="mdi:circle"
              ></iconify-icon>
            </div>
            <div
              class="timeline-end timeline-box bg-neutral border-base-100/80 !pr-1"
            >
              <Editable
                as="span"
                size="sm"
                editAs="textarea"
                class="text-balance"
                value={moment.text ?? "Click to edit"}
                onUpdate={(text) => updateMoment(moment.id, text)}
              />
            </div>
            {#if i < session.moments.length - 1}
              <hr class="bg-base-100/30" />
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
