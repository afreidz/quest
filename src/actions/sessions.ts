import orm from "@hsalux/quest-db";
import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";
import { AzureKeyCredential } from "@azure/core-auth";
import { PaginationSchema } from "@/utilities/actions";
import { RoomsClient } from "@azure/communication-rooms";
import { CommunicationIdentityClient } from "@azure/communication-identity";

const ONE_HOUR = 60000;
const SESSION_START_BUFFER = ONE_HOUR;
const SESSION_END_BUFFER = ONE_HOUR * 24;

const key = import.meta.env.AZURE_COMS_KEY;
const endpoint = import.meta.env.AZURE_COMS_ENDPOINT;

const credential = new AzureKeyCredential(key);
const roomClient = new RoomsClient(endpoint, credential);
const idClient = new CommunicationIdentityClient(endpoint, credential);

const SessionCreateSchema = z.object({
  revision: z.string(),
  respondent: z.string(),
  moderator: z.string(),
  scheduled: z.string().transform((str) => new Date(str)),
});

const SessionUpdateSchema = z.object({
  callId: z.string().optional(),
  videoURL: z.string().optional(),
  moderator: z.string().optional(),
  recordingId: z.string().optional(),
  started: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  completed: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  scheduled: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
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

    if (!respondent)
      throw new Error(`Unable to find participant "${sessionData.respondent}"`);

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

    const d = new Date(sessionData.scheduled.toUTCString());
    const roomOpen = new Date(+d - SESSION_START_BUFFER);
    const roomClose = new Date(+roomOpen + SESSION_END_BUFFER);

    const moderator = await idClient.createUser().catch((err) => {
      console.log(err);
      throw err;
    });

    const room = await roomClient
      .createRoom({
        validFrom: roomOpen,
        validUntil: roomClose,
        pstnDialOutEnabled: false,
        participants: [
          {
            role: "Presenter",
            id: { communicationUserId: moderator.communicationUserId },
          },
          {
            role: "Attendee",
            id: { communicationUserId: respondentComsId! },
          },
        ],
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });

    return orm.session.create({
      data: {
        roomComsId: room.id,
        createdBy: creator.email!,
        moderator: sessionData.moderator,
        revisionId: sessionData.revision,
        respondentId: sessionData.respondent,
        moderatorComsId: moderator.communicationUserId,
        scheduled: sessionData.scheduled.toISOString(),
      },
      include: {
        revision: {
          include: {
            system: {
              include: { client: true },
            },
          },
        },
        respondent: true,
      },
    });
  },
});

export const getAll = defineAction({
  input: PaginationSchema,
  handler: async (pagination) => {
    return await orm.session.findMany({
      orderBy: { createdAt: "asc" },
      skip: pagination?.skip,
      take: pagination?.take,
      include: {
        revision: {
          include: {
            system: {
              include: { client: true },
            },
          },
        },
        respondent: true,
      },
    });
  },
});

export const getById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.session.findFirst({
      where: { id },
      include: {
        revision: {
          include: {
            system: {
              include: { client: true },
            },
          },
        },
        respondent: true,
      },
    });
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
      include: {
        revision: {
          include: {
            system: {
              include: { client: true },
            },
          },
        },
        respondent: true,
      },
    });
  },
});

export const updateById = defineAction({
  input: z.object({
    id: z.string(),
    data: SessionUpdateSchema,
  }),
  handler: async ({ id, data }) => {
    const session = await orm.session.findFirst({ where: { id } });

    if (!session) throw new Error(`Unable to find session "${id}"`);

    if (data.scheduled) {
      const d = new Date(data.scheduled.toUTCString());
      const roomOpen = new Date(+d - SESSION_START_BUFFER);
      const roomClose = new Date(+roomOpen + SESSION_END_BUFFER);

      await roomClient.updateRoom(session.roomComsId, {
        validFrom: roomOpen,
        validUntil: roomClose,
      });
    }

    return await orm.session.update({
      where: { id },
      data: {
        ...data,
      },
    });
  },
});

export type Sessions = Awaited<ReturnType<typeof getAll>>;
export type NewSessionSchema = z.infer<typeof SessionCreateSchema>;
export type SessionFromAll = Awaited<ReturnType<typeof getAll>>[number];
