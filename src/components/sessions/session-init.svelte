<script lang="ts">
  import session from "@/stores/session.svelte";
  import { onMount, type Snippet } from "svelte";
  import Actions from "@/components/sessions/actions.svelte";
  import CardHeader from "@/components/app/card-header.svelte";
  import Countdown from "@/components/sessions/countdown.svelte";
  import { LocalVideoStream } from "@azure/communication-calling";
  import type { SessionById, SessionFromAll } from "@/actions/sessions";
  import { getInstant, now as getNow, isBefore } from "@/utilities/time";
  import Participant from "@/components/sessions/participant-view.svelte";

  type Props = {
    children: Snippet;
    role: "host" | "participant";
    session: SessionFromAll | SessionById;
  };

  let now = $state(getNow());
  let { role, children, session: dbSession }: Props = $props();
  let start = $derived(getInstant(dbSession.scheduled.toISOString()));

  let feed = $derived(
    session.camEnabled && session.camera
      ? new LocalVideoStream(session.camera)
      : undefined,
  );

  let early = $derived(
    isBefore(now, start) &&
      !["Connected", "Connecting"].includes(session.status),
  );

  onMount(async () => {
    session.role = role;
    session.id = dbSession.id;
    session.respondentId = dbSession.respondent.id;

    session.name =
      role === "host"
        ? dbSession.moderator
        : dbSession.respondent.name || dbSession.respondent.email;

    session.userId =
      role === "host"
        ? dbSession.moderatorComsId
        : (dbSession.respondent.comsId ?? undefined);
  });

  async function handleCountdownUpdate() {
    if (early) now = getNow();
  }

  async function connect() {
    await session.connect();
  }
</script>

<svelte:window
  onbeforeunload={async () => {
    await session.disconnect();
  }}
/>

{#snippet subText()}
  <span class="font-normal">
    {#if early}
      Your live moderated session is not yet ready to start. It is scheduled to
      start in:
    {/if}
  </span>
{/snippet}

<div class="w-full flex-1 flex flex-col items-center justify-center m-6 gap-4">
  <!-- {#if session.status !== "Connected"}
    <div
      class="flex flex-col items-center justify-center card rounded-box bg-neutral border shadow-sm gap-4"
    >
      <CardHeader icon="tabler:live-photo" {subText}>
        Session with {dbSession.respondent.name || dbSession.respondent.email}
      </CardHeader>
      {#if early}
        <Countdown
          onupdate={handleCountdownUpdate}
          until={dbSession.scheduled.toISOString()}
        />
      {/if}
      <Participant
        {feed}
        class="w-52"
        id={"preview"}
        bootable={false}
        name={session.name}
        muted={session.muted}
      />
      <Actions />
      <div class="flex-1 flex items-center justify-between p-4 w-full">
        {#if role === "host" || !early}
          <div class="flex flex-col flex-1">
            <div class="form-control items-start justify-center">
              <label class="label cursor-pointer pb-0">
                <span class="label-text">
                  <iconify-icon icon="mdi:webcam" class="text-lg mt-1"
                  ></iconify-icon>
                  <span class="sr-only">Toggle Camera</span>
                </span>
                <input
                  type="checkbox"
                  checked={session.camEnabled}
                  class="ml-1 toggle toggle-sm toggle-primary [--tglbg:#ffffff]"
                  onchange={() =>
                    session.camEnabled
                      ? session.disableCamera()
                      : session.enableCamera()}
                />
              </label>
            </div>
            <div class="form-control items-start">
              <label class="label cursor-pointer pb-0">
                <iconify-icon icon="mdi:microphone" class="text-lg mt-1"
                ></iconify-icon>
                <span class="label-text">
                  <span class="sr-only">Toggle Microphone</span>
                </span>
                <input
                  type="checkbox"
                  checked={!session.muted}
                  class="ml-1 toggle toggle-sm toggle-primary [--tglbg:#ffffff]"
                  onchange={() =>
                    session.muted ? session.unmute() : session.mute()}
                />
              </label>
            </div>
          </div>
          <button
            onclick={connect}
            disabled={session.status === "Connecting"}
            class="btn btn-primary btn-lg flex-none"
          >
            {#if early}Start Now{:else}Connect{/if}
          </button>
          <div class="flex-1"></div>
        {/if}
      </div>
    </div>
  {:else}
    {@render children()}
  {/if} -->
  {@render children()}
</div>
