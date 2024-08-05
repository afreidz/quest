import orm from "@hsalux/quest-db";
import { defineAction, z } from "astro:actions";
import { Temporal } from "@js-temporal/polyfill";

const schema = z.object({
  text: z.string(),
  session: z.string(),
  speaker: z.string().optional(),
  moderator: z.boolean().optional().default(false),
  time: z
    .string()
    .transform((str) => {
      return Temporal.Instant.from(str);
    })
    .optional()
    .default(
      new Date(
        Temporal.Now.instant().toZonedDateTimeISO("utc").epochMilliseconds,
      ).toISOString(),
    ),
});

export const createRespondentUtterance = defineAction({
  input: schema,
  handler: async (input) => {
    const time = input.time.toZonedDateTimeISO("utc");

    return await orm.transcriptionSegment.create({
      data: {
        text: input.text,
        moderator: undefined,
        speakerId: input.speaker,
        sessionId: input.session,
        time: new Date(time.epochMilliseconds).toISOString(),
      },
    });
  },
});

export const createModeratorUtterance = defineAction({
  input: schema,
  handler: async (input) => {
    const time = input.time.toZonedDateTimeISO("utc");

    return await orm.transcriptionSegment.create({
      data: {
        moderator: true,
        text: input.text,
        speakerId: undefined,
        sessionId: input.session,
        time: new Date(time.epochMilliseconds).toISOString(),
      },
    });
  },
});
