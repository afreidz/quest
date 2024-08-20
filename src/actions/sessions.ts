import orm from "@hsalux/quest-db";
import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";
import { sessionToEmail } from "@/utilities/events";
import { AzureKeyCredential } from "@azure/core-auth";
import { PaginationSchema } from "@/utilities/actions";
import { EmailClient } from "@azure/communication-email";
import { include as revisionIncludes } from "@/actions/revisions";
import { CallRecording } from "@azure/communication-call-automation";
import { CommunicationIdentityClient } from "@azure/communication-identity";

const key = import.meta.env.AZURE_COMS_KEY;
const endpoint = import.meta.env.AZURE_COMS_ENDPOINT;

const credential = new AzureKeyCredential(key);
const emailClient = new EmailClient(endpoint, credential);
const recordingClient = new CallRecording(endpoint, credential);
const idClient = new CommunicationIdentityClient(endpoint, credential);
const recordingDestinationContainerUrl = `https://${import.meta.env.PUBLIC_STORAGE_ACCOUNT}.blob.core.windows.net/participant-videos/`;

const include = {
  moments: true,
  recordings: true,
  respondent: true,
  revision: { include: revisionIncludes },
  transcripts: { include: { recording: true } },
};

const SessionCreateSchema = z.object({
  revision: z.string(),
  moderator: z.string(),
  scheduled: z.string(),
  respondent: z.string(),
  prototype: z.string().optional(),
  invite: z.boolean().default(false),
});

const SessionUpdateSchema = z.object({
  callId: z.string().optional(),
  started: z.string().optional(),
  videoURL: z.string().optional(),
  moderator: z.string().optional(),
  completed: z.string().optional(),
  scheduled: z.string().optional(),
  recordingId: z.string().optional(),
});

const SessionQuerySchema = z.object({
  clients: z.array(z.string()).optional(),
  systems: z.array(z.string()).optional(),
  moderator: z.string().email().optional(),
  revisions: z.array(z.string()).optional(),
  respondents: z.array(z.string()).optional(),
  incomplete: z.boolean().default(false).optional(),
  hasNoRecordings: z.boolean().default(false).optional(),
  hasNoTranscripts: z.boolean().default(false).optional(),
});

const SesssionMomentSchema = z.object({
  time: z.string(),
  session: z.string(),
  text: z.string().optional(),
});

export const create = defineAction({
  input: SessionCreateSchema,
  handler: async (sessionData, context) => {
    const creator = (await getSession(context.request))?.user as User;

    const respondent = await orm.respondent.findFirst({
      where: { id: sessionData.respondent },
    });

    const revision = await orm.revision.findFirst({
      where: { id: sessionData.revision },
      include: { system: { include: { client: true } } },
    });

    if (!respondent)
      throw new Error(`Unable to find participant "${sessionData.respondent}"`);

    if (!revision)
      throw new Error(`Unable to find revision "${sessionData.respondent}"`);

    let respondentComsId = respondent.comsId;

    if (!respondentComsId) {
      const user = await idClient.createUser().catch((err) => {
        console.log(err);
        throw err;
      });

      await orm.respondent.update({
        where: { id: respondent.id },
        data: { comsId: user.communicationUserId },
      });

      respondentComsId = user.communicationUserId;
    }

    const moderator = await idClient.createUser();
    const scheduled = new Date(sessionData.scheduled).toISOString();

    const session = await orm.session
      .create({
        data: {
          scheduled,
          createdBy: creator.email!,
          invite: sessionData.invite,
          moderator: sessionData.moderator,
          revisionId: sessionData.revision,
          prototypeURL: sessionData.prototype,
          respondentId: sessionData.respondent,
          moderatorComsId: moderator.communicationUserId,
        },
        include,
      })
      .catch((err) => {
        throw new Error(`Unable to save session due to: ${err.message}`);
      });

    if (sessionData.invite) {
      const poller = await emailClient.beginSend(sessionToEmail(session));
      await poller.pollUntilDone();
    }

    return session;
  },
});

export const getAll = defineAction({
  input: PaginationSchema,
  handler: async (pagination) => {
    return await orm.session.findMany({
      orderBy: { createdAt: "asc" },
      skip: pagination?.skip,
      take: pagination?.take,
      include,
    });
  },
});

export const getById = defineAction({
  input: z.string(),
  handler: async (id) => {
    const session = await orm.session.findFirst({
      where: { id },
      include,
    });

    if (!session) throw new Error("Unable to find session");

    return session;
  },
});

export const getByQuery = defineAction({
  input: SessionQuerySchema.optional(),
  handler: async (input) => {
    const whereConditions: any = [];

    if (input?.respondents) {
      whereConditions.push({
        respondentId: { in: input.respondents },
      });
    }

    if (input?.hasNoRecordings === true) {
      whereConditions.push({
        recordings: { none: {} },
      });
    }

    if (input?.hasNoTranscripts === true) {
      whereConditions.push({
        transcripts: { none: {} },
      });
    }

    if (input?.incomplete === true) {
      whereConditions.push({
        completed: { equals: null },
      });
    }

    if (input?.moderator) {
      whereConditions.push({ moderator: input.moderator });
    }

    if (input?.revisions) {
      whereConditions.push({
        revisionId: { in: input.revisions },
      });
    }

    if (input?.systems && input?.clients) {
      whereConditions.push({
        revision: {
          is: {
            systemId: { in: input.systems },
            system: {
              is: { clientId: { in: input.clients } },
            },
          },
        },
      });
    } else if (input?.systems && !input?.clients) {
      whereConditions.push({
        revision: {
          is: {
            systemId: { in: input.systems },
          },
        },
      });
    } else if (input?.clients) {
      whereConditions.push({
        revision: {
          is: {
            system: {
              is: {
                clientId: { in: input.clients },
              },
            },
          },
        },
      });
    }

    return await orm.session.findMany({
      where: whereConditions.length > 0 ? { AND: whereConditions } : undefined,
      include,
    });
  },
});

export const updateById = defineAction({
  input: z.object({
    id: z.string(),
    data: SessionUpdateSchema,
  }),
  handler: async ({ id, data }) => {
    const session = await orm.session.findFirst({ where: { id }, include });

    if (!session) throw new Error(`Unable to find session "${id}"`);

    const scheduled = data.scheduled
      ? new Date(data.scheduled).toISOString()
      : undefined;

    const started = data.started
      ? new Date(data.started).toISOString()
      : undefined;

    const completed = data.completed
      ? new Date(data.completed).toISOString()
      : undefined;

    const updated = await orm.session.update({
      where: { id },
      data: {
        ...data,
        started,
        scheduled,
        completed,
        version: (session.version || 0) + 1,
      },
      include,
    });

    if (updated.invite) {
      const poller = await emailClient.beginSend(
        sessionToEmail(updated, "update"),
      );
      await poller.pollUntilDone();
    }

    return updated;
  },
});

export const deleteById = defineAction({
  input: z.string(),
  handler: async (id) => {
    const session = await orm.session.findFirst({ where: { id }, include });

    if (!session) throw new Error(`Unable to find session "${id}"`);

    const resp = await orm.session.delete({ where: { id } });

    if (session.invite) {
      const poller = await emailClient.beginSend(
        sessionToEmail(session, "cancel"),
      );
      await poller.pollUntilDone();
    }

    return resp;
  },
});

export const startRecording = defineAction({
  input: z.object({
    callId: z.string(),
    sessionId: z.string(),
  }),
  handler: async ({ callId, sessionId }, context) => {
    const creator = (await getSession(context.request))?.user as User;
    const session = await orm.session.findFirst({ where: { id: sessionId } });
    if (!session) throw new Error(`Unable to find session id: "${sessionId}"`);

    const recordingStateCallbackEndpointUrl = new URL(
      "/sessions/events",
      import.meta.env.ORIGIN,
    ).href;

    const resp = await recordingClient.start({
      recordingFormat: "mp4",
      recordingContent: "audioVideo",
      recordingStateCallbackEndpointUrl,
      callLocator: { id: callId, kind: "serverCallLocator" },
      recordingStorage: {
        recordingDestinationContainerUrl,
        recordingStorageKind: "azureBlobStorage",
      },
    });

    const recording = await orm.sessionRecording.create({
      data: {
        type: "FULL",
        id: resp.recordingId,
        sessionId: session.id,
        createdBy: creator.email!,
      },
    });

    return recording.id;
  },
});

export const stopRecording = defineAction({
  input: z.string(),
  handler: async (id) => {
    const resp = await recordingClient.stop(id).catch((err) => err);
    const session = await orm.session.findFirst({
      where: { recordings: { some: { id } } },
    });

    if (session) {
      await orm.session.update({
        where: { id: session.id },
        data: {
          completed: new Date(),
        },
      });
    }

    return resp;
  },
});

export const addMoment = defineAction({
  input: SesssionMomentSchema,
  handler: async (input, context) => {
    const creator = (await getSession(context.request))?.user as User;
    return await orm.keyMoment.create({
      data: {
        text: input.text,
        time: input.time,
        sessionId: input.session,
        createdBy: creator.email ?? "system@quest.hsalux.app",
      },
    });
  },
});

export const updateMomentText = defineAction({
  input: z.object({
    moment: z.string(),
    text: z.string(),
  }),
  handler: async (input) => {
    return await orm.keyMoment.update({
      where: { id: input.moment },
      data: { text: input.text },
    });
  },
});

export const deleteMoment = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.keyMoment.delete({ where: { id } });
  },
});

export const createClip = defineAction({
  input: z.object({
    recordingId: z.string(),
    start: z.number().min(0),
    duration: z.number().min(0).max(300).optional(),
  }),
  handler: async (input, context) => {
    const creator = (await getSession(context.request))?.user as User;

    const recording = await orm.sessionRecording.findFirst({
      where: { id: input.recordingId },
    });

    if (!recording || !recording.videoURL)
      throw new Error(`Unable to find recording ${input.recordingId}`);

    const clip = new URL("/api/clip", import.meta.env.AZURE_FUNCTION_APP_URL);

    const resp = await fetch(clip.href, {
      method: "post",
      body: JSON.stringify({
        start: input.start,
        url: recording.videoURL,
        duration: input.duration,
      }),
    });

    if (!resp.ok) throw new Error(`Unable to create clip`);

    const { url } = await resp.json();

    if (!url) throw new Error("No clip was created");

    return await orm.sessionRecording.create({
      data: {
        type: "CLIP",
        videoURL: url,
        offset: input.start,
        createdBy: creator.email!,
        duration: input.duration ?? 0,
        sessionId: recording.sessionId,
      },
    });
  },
});

export type Sessions = Awaited<
  ReturnType<typeof orm.session.findMany<{ include: typeof include }>>
>;

export type SessionById = Sessions[number];
export type SessionFromAll = Sessions[number];
export type SessionQuery = z.infer<typeof SessionQuerySchema>;
export type NewSessionSchema = z.infer<typeof SessionCreateSchema>;
