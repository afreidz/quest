import orm from "@hsalux/quest-db";
import { defineAction, z } from "astro:actions";

const schema = z.object({
  text: z.string(),
  offset: z.number(),
  session: z.string(),
  duration: z.number(),
  recording: z.string(),
  speaker: z.string().optional(),
  moderator: z.boolean().optional().default(false),
});

export const createRespondentUtterance = defineAction({
  input: schema,
  handler: async (input) => {
    return await orm.transcriptionSegment.create({
      data: {
        text: input.text,
        offset: input.offset,
        moderator: undefined,
        duration: input.duration,
        speakerId: input.speaker,
        sessionId: input.session,
        recordingId: input.recording,
      },
    });
  },
});

export const createModeratorUtterance = defineAction({
  input: schema,
  handler: async (input) => {
    return await orm.transcriptionSegment.create({
      data: {
        moderator: true,
        text: input.text,
        speakerId: undefined,
        offset: input.offset,
        sessionId: input.session,
        duration: input.duration,
        recordingId: input.recording,
      },
    });
  },
});
