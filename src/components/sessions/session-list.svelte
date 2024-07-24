<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import store from "@/stores/global.svelte";
  import messages from "@/stores/messages.svelte";
  import { preventDefault } from "@/utilities/events";
  import Actions from "@/components/app/actions.svelte";
  import type { NewSessionSchema } from "@/actions/sessions";

  onMount(async () => {
    await store.refreshMe();
    await store.refreshAllSessions();
  });

  // Use "en-ca" so that the date is formatted YYYY-MM-DD
  const dateFormatter = new Intl.DateTimeFormat("en-ca", {
    day: "2-digit",
    year: "numeric",
    month: "2-digit",
  });

  const timeFormatter = new Intl.DateTimeFormat("en-us", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const displayFormatter = new Intl.DateTimeFormat("en-us", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  let loading = $state(false);
  let suggestionText = $state("");
  let showCreateSessionForm: boolean = $state(false);
  let chosenTime: string = $state(timeFormatter.format(new Date()));
  let chosenDate: string = $state(dateFormatter.format(new Date()));
  let newSession: NewSessionSchema = $state({
    revision: "",
    moderator: "",
    respondent: "",
    scheduled: new Date(),
  });

  let respondents = $derived.by(async () => {
    if (!showCreateSessionForm) return [];
    loading = true;
    return suggestionText
      ? actions.respondents.getBySearch(suggestionText).then((r) => {
          loading = false;
          return r;
        })
      : actions.respondents.getAll(undefined).then((r) => {
          loading = false;
          return r;
        });
  });

  let revisions = $derived.by(async () => {
    if (!showCreateSessionForm || !newSession.respondent) return [];
    loading = true;
    return actions.revision
      .getByRespondentId(newSession.respondent)
      .then((r) => {
        loading = false;
        return r;
      });
  });

  $effect(() => {
    if (newSession.respondent) {
      newSession.revision = "";
    }
  });

  $effect(() => {
    if (store.me?.email && !newSession.moderator)
      newSession.moderator = store.me.email;
  });

  $effect(() => {
    if (chosenDate) {
      const [year, month, day] = chosenDate.split("-").map(Number);
      newSession.scheduled.setDate(day);
      newSession.scheduled.setFullYear(year);
      newSession.scheduled.setMonth(month - 1);
      newSession.scheduled.setHours(0, 0, 0, 0);
    }
    if (chosenTime) {
      const [hours, minutes] = chosenTime.split(":").map(Number);
      newSession.scheduled.setHours(hours);
      newSession.scheduled.setMinutes(minutes);
    }
  });

  async function scheduleSession() {
    showCreateSessionForm = false;

    loading = true;
    const resp = await actions.sessions
      .create({
        ...newSession,
        scheduled: newSession.scheduled.toISOString(),
      })
      .catch((err) => {
        console.log(err);
        messages.error(err.message, err.detail);
      });

    loading = false;
    newSession = {
      revision: "",
      respondent: "",
      scheduled: new Date(),
      moderator: store.me?.email ?? "",
    };

    if (!resp) return;

    await store.refreshAllSessions();
    messages.success("Client created", JSON.stringify(resp, null, 2));
  }
</script>

<div
  class="min-w-80 max-w-md w-1/3 bg-neutral flex flex-col border-neutral-200 border-r sticky top-0"
>
  <h2
    class="p-3 flex-none border-neutral-200 border-b text-xl font-bold flex justify-between items-center"
  >
    <span>Sessions</span>
    <Actions
      addForm={createSessionForm}
      addTip="Schedule a New Session"
      bind:addShown={showCreateSessionForm}
      class="max-w-[65vw] min-w-[800px] w-full max-h-[95vh] min-h-[800px] h-full flex flex-col"
    />
  </h2>
  <div
    class:skeleton={loading}
    class="bg-neutral rounded-none flex-1 overflow-auto"
  >
    {#if !loading}
      {#each store.sessions.all as session}
        <button
          class:tooltip={store.sessions.unsaved}
          class:highlight={store.sessions.active?.id === session.id}
          data-tip={"You have unsaved changes to the current session!"}
          onclick={preventDefault(() => store.setActiveSession(session))}
          class="btn btn-primary btn-lg btn-outline rounded-none w-full tooltip-error tooltip-top first:tooltip-bottom tooltip-b text-left border-neutral-200 border-t-0 border-r-0 border-l-0 !h-auto px-4 py-4"
        >
          <div class="flex flex-1 items-center justify-start gap-4">
            <div class="flex-none flex justify-center">
              <iconify-icon class="text-neutral-400" icon="tabler:live-photo"
              ></iconify-icon>
            </div>
            <div class="flex flex-col gap-2 flex-1">
              <div class="flex items-center gap-2">
                <span class="badge badge-primary"
                  >{session.revision.system.client.name}</span
                >
                <span class="badge badge-secondary"
                  >{session.revision.system.title}</span
                >
              </div>
              <strong class="font-semibold"
                >Session with {session.respondent.name ??
                  session.respondent.email}</strong
              >
              <small class="text-xs text-neutral-400"
                >{displayFormatter.format(new Date(session.scheduled))}</small
              >
            </div>
          </div>
        </button>
      {/each}
    {/if}
  </div>
</div>

<div class="flex-1 p-4 overflow-auto">
  {#if store.sessions.active}
    <a href={`/sessions/participate/${store.sessions.active.id}`}
      >Go To Participate</a
    >
  {/if}
</div>

{#snippet createSessionForm()}
  <form
    onsubmit={preventDefault(scheduleSession)}
    class="flex-1 bg-base-100/10 border rounded-box flex font-normal overflow-clip"
  >
    <div
      class:skeleton={loading}
      class="min-w-80 w-1/3 max-w-sm bg-neutral rounded-none flex-1 border-r h-full overflow-auto flex flex-col"
    >
      <h2
        class="p-3 flex-none border-neutral-200 border-b text-base font-bold flex justify-between items-center"
      >
        <span>Select Respondent</span>
      </h2>
      <div class="p-3 flex-none border-neutral-200 border-b">
        <label
          class="input input-bordered input-sm bg-base-100/10 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Search"
            class="grow skip-focus"
            bind:value={suggestionText}
          />
          <iconify-icon class="text-xl" icon="material-symbols:search"
          ></iconify-icon>
        </label>
      </div>
      <div class="flex-1 overflow-auto">
        {#await respondents then respondents}
          {#each respondents as respondent}
            <button
              type="button"
              onclick={() => (newSession.respondent = respondent.id)}
              class:highlight={newSession.respondent === respondent.id}
              class="skip-focus btn btn-primary btn-lg btn-outline rounded-none w-full text-left border-neutral-200 border-t-0 border-r-0 border-l-0 flex"
            >
              <span class="flex-1">{respondent.name ?? respondent.email}</span>
            </button>
          {/each}
        {/await}
      </div>
    </div>
    <div
      class="min-w-80 w-1/3 max-w-sm bg-neutral flex flex-col border-neutral-200 border-r"
    >
      <h2
        class="p-3 flex-none border-neutral-200 border-b text-base font-bold flex justify-between items-center"
      >
        <span>Select a Revision</span>
      </h2>
      <div
        class:skeleton={loading}
        class="bg-base-100/20 rounded-none flex-1 overflow-auto flex flex-col justify-center"
      >
        {#await revisions then revisions}
          {#each revisions as revision}
            <button
              type="button"
              onclick={() => (newSession.revision = revision.id)}
              class:highlight={newSession.revision === revision.id}
              class="btn bg-neutral btn-primary btn-lg btn-outline rounded-none w-full text-left border-neutral-200 border-r-0 border-l-0 [&:not(:first-child)]:border-t-0 flex"
            >
              <span class="flex-1">{revision.title}</span>
              <div class="badge badge-secondary">
                {revision.system.title}
              </div>
            </button>
          {/each}
        {/await}
      </div>
    </div>
    {#if newSession.respondent && newSession.revision}
      <div class="p-3 px-4 flex flex-col flex-1 gap-3">
        <header class="text-base font-semibold flex justify-between opacity-50">
          Schedule Session
        </header>
        <section class="flex gap-8 w-full flex-none p-1">
          <label class="form-control flex-1">
            <div class="label">
              <span class="label-text">Date</span>
              <span class="label-text-alt italic">Required</span>
            </div>
            <input
              required
              type="date"
              value={chosenDate}
              class="input input-bordered bg-neutral w-full accent-primary"
            />
          </label>
          <label class="form-control flex-1">
            <div class="label">
              <span class="label-text">Time</span>
              <span class="label-text-alt italic">Required</span>
            </div>
            <input
              required
              type="time"
              value={chosenTime}
              class="input input-bordered bg-neutral w-full accent-primary"
            />
          </label>
        </section>
        <div class="flex flex-1 gap-8">
          <section class="flex flex-col gap-2 flex-1 p-1">
            <label class="form-control flex-none">
              <div class="label">
                <span class="label-text">Moderator</span>
                <span class="label-text-alt italic">Required</span>
              </div>
              <input
                type="email"
                bind:value={newSession.moderator}
                class="input input-bordered bg-neutral w-full"
              />
            </label>
          </section>
        </div>
        <footer class="flex-none flex justify-end gap-4 p-1">
          <button
            class="btn btn-ghost"
            onclick={preventDefault(() => (showCreateSessionForm = false))}
          >
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">Schedule Session</button
          >
        </footer>
      </div>
    {/if}
  </form>
{/snippet}

<style lang="postcss">
  .highlight {
    @apply bg-secondary/30 border-l-4 border-l-secondary;
  }
</style>
