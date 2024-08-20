<script lang="ts">
  import store from "@/stores/global.svelte";
  import Avatar from "@/components/respondents/avatar.svelte";
  import CardHeader from "@/components/app/card-header.svelte";
  import { getInstant, formatDurationToHHMMSS } from "@/utilities/time";
  import type { SessionById, SessionFromAll } from "@/actions/sessions";

  type Props = {
    session: SessionFromAll | SessionById;
  };

  let { session }: Props = $props();

  function selectUtterance(
    utterance: (typeof store.sessions.all)[number]["transcripts"][number],
  ) {
    const recording = session.recordings.find(
      (r) => r.id === utterance.recordingId,
    );

    store.setActiveUtterance(null);
    store.setActiveUtterance(utterance);
    store.setActiveRecording(recording ?? null);
  }

  function displayUtteranceTime(
    utterance: (typeof session)["transcripts"][number],
  ) {
    if (!utterance.recording.started) return "00:00:00";

    const recordingStart = getInstant(utterance.recording.started.toString());
    const utteranceStart = recordingStart.add({
      milliseconds: utterance.offset - utterance.duration,
    });

    const duration = utteranceStart.since(recordingStart);
    return formatDurationToHHMMSS(duration);
  }
</script>

<div class="collapse rounded-none collapse-arrow">
  <input type="checkbox" checked />
  <CardHeader
    class="flex-none border-t bg-neutral collapse-title"
    icon="mdi:speak-outline">Transcription</CardHeader
  >
  <div class="collapse-content">
    <ul class="flex-1 overflow-auto flex flex-col justify-start p-2">
      {#each session.transcripts as utterance}
        <li
          class="chat"
          class:chat-end={!utterance.moderator}
          class:chat-start={utterance.moderator}
        >
          <Avatar
            tip={utterance.moderator
              ? session.moderator
              : session.respondent.email}
            class="chat-image {utterance.moderator
              ? 'tooltip-right'
              : 'tooltip-left'}"
            respondent={{
              email: utterance.moderator
                ? session.moderator
                : session.respondent.name || session.respondent.email,
              imageURL: utterance.moderator
                ? null
                : session.respondent.imageURL,
            }}
          />
          <button
            onclick={() => selectUtterance(utterance)}
            class="chat-bubble shadow-sm"
            class:chat-bubble-secondary={utterance.moderator}
          >
            {utterance.text}
          </button>
          <div class="chat-footer opacity-50 text-[10px]">
            {displayUtteranceTime(utterance)}
          </div>
        </li>
      {/each}
    </ul>
  </div>
</div>
