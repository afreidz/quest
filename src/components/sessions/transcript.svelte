<script lang="ts">
  import store from "@/stores/global.svelte";
  import Avatar from "@/components/respondents/avatar.svelte";
  import CardHeader from "@/components/app/card-header.svelte";
  import { getInstant, displayTimeFormatter } from "@/utilities/time";

  type Props = {
    onclick?: (s: number) => void;
  };

  let { onclick }: Props = $props();

  function jumpVideoToTime(
    utterance: (typeof store.sessions.all)[number]["transcripts"][number],
  ) {
    const recording = store.sessions.active?.recordings.find(
      (r) => r.id === utterance.recordingId,
    );
    if (!recording) return;
    store.setActiveRecording(recording);

    const ms = utterance.offset - utterance.duration;
    onclick?.(ms / 1000);
  }

  function displayUtteranceTime(
    utterance: (typeof store.sessions.all)[number]["transcripts"][number],
  ) {
    const start = getInstant(utterance.recording.started.toString());
    const instant = start.add({
      milliseconds: utterance.offset - utterance.duration,
    });

    return displayTimeFormatter.format(new Date(instant.epochMilliseconds));
  }
</script>

{#if store.sessions.active}
  {@const session = store.sessions.active}
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
              onclick={() => jumpVideoToTime(utterance)}
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
{/if}
