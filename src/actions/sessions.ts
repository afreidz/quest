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
  revision: { include: revisionIncludes },
  recordings: true,
  respondent: true,
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

const SessionQuerySchema = z
  .object({
    clients: z.array(z.string()).optional(),
    systems: z.array(z.string()).optional(),
    revisions: z.array(z.string()).optional(),
    respondents: z.array(z.string()).optional(),
  })
  .refine(
    (data) =>
      !!data.revisions ? !data.systems?.length && !data.clients?.length : true,
    {
      message:
        "If 'revision' is defined, 'system' and 'client' must be undefined",
    },
  )
  .refine((data) => (!!data.systems ? !data.clients?.length : true), {
    message: "If 'system' is defined, 'client' must be undefined",
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
  input: SessionQuerySchema,
  handler: async (input) => {
    return await orm.session.findMany({
      where: {
        OR: [
          {
            respondentId: { in: input.respondents },
          },
          { revisionId: { in: input.revisions } },
          {
            revision: {
              is: {
                OR: [
                  {
                    systemId: { in: input.systems },
                  },
                  {
                    system: {
                      is: {
                        clientId: { in: input.clients },
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
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
  handler: async ({ callId, sessionId }) => {
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

    const started = new Date();

    const recording = await orm.sessionRecording.create({
      data: {
        id: resp.recordingId,
        sessionId: session.id,
        started,
      },
    });

    if (!session.started) {
      await orm.session.update({
        where: { id: sessionId },
        data: {
          started,
        },
      });
    }

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

    if (session && !session.completed) {
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

export type Sessions = Awaited<
  ReturnType<typeof orm.session.findMany<{ include: typeof include }>>
>;

export type SessionById = Sessions[number];
export type SessionFromAll = Sessions[number];
export type NewSessionSchema = z.infer<typeof SessionCreateSchema>;
