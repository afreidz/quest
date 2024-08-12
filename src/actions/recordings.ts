import orm from "@hsalux/quest-db";
import { defineAction, z } from "astro:actions";

const include = {};

export const getById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.sessionRecording.findFirst({ where: { id }, include });
  },
});

export const getBySessionId = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.sessionRecording.findMany({
      where: { sessionId: id },
      include,
    });
  },
});

export type Recordings = Awaited<
  ReturnType<typeof orm.sessionRecording.findMany<{ include: typeof include }>>
>;

export type RecordingById = Recordings[number];
export type RecordingFromAll = Recordings[number];
