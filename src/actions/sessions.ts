import orm from "@hsalux/quest-db";
import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";
import { Temporal } from "@js-temporal/polyfill";
import { AzureKeyCredential } from "@azure/core-auth";
import { PaginationSchema } from "@/utilities/actions";
import { RoomsClient } from "@azure/communication-rooms";
import { CommunicationIdentityClient } from "@azure/communication-identity";

const ONEDAY = Temporal.Duration.from({ days: 1 });

const key = import.meta.env.AZURE_COMS_KEY;
const endpoint = import.meta.env.AZURE_COMS_ENDPOINT;

const credential = new AzureKeyCredential(key);
const roomClient = new RoomsClient(endpoint, credential);
const idClient = new CommunicationIdentityClient(endpoint, credential);

const SessionCreateSchema = z.object({
  revision: z.string(),
  respondent: z.string(),
  moderator: z.string(),
  scheduled: z.string().transform((str) => {
    console.log("ANDY OG STRING", str);
    return Temporal.Instant.from(str);
  }),
});

const SessionUpdateSchema = z.object({
  callId: z.string().optional(),
  videoURL: z.string().optional(),
  moderator: z.string().optional(),
  recordingId: z.string().optional(),
  started: z
    .string()
    .transform((str) => Temporal.Instant.from(str))
    .optional(),
  completed: z
    .string()
    .transform((str) => Temporal.Instant.from(str))
    .optional(),
  scheduled: z
    .string()
    .transform((str) => Temporal.Instant.from(str))
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

    const moderator = await idClient.createUser().catch((err) => {
      console.log(err);
      throw err;
    });

    const scheduled = sessionData.scheduled.toZonedDateTimeISO("utc");
    const roomOpen = Temporal.ZonedDateTime.from(scheduled).subtract(ONEDAY);
    const roomClose = Temporal.ZonedDateTime.from(scheduled).add(ONEDAY);

    const validFrom = new Date(roomOpen.epochMilliseconds);
    const validUntil = new Date(roomClose.epochMilliseconds);

    const room = await roomClient
      .createRoom({
        validFrom,
        validUntil,
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
        scheduled: new Date(scheduled.epochMilliseconds).toISOString(),
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
    const session = await orm.session.findFirst({
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

    if (!session) return;

    const room = await roomClient.getRoom(session.roomComsId);

    return { ...session, room };
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

    const scheduled = data.scheduled?.toZonedDateTimeISO("utc");

    if (scheduled) {
      const roomOpen = Temporal.ZonedDateTime.from(scheduled).subtract(ONEDAY);
      const roomClose = Temporal.ZonedDateTime.from(scheduled).add(ONEDAY);

      const validFrom = new Date(roomOpen.epochMilliseconds);
      const validUntil = new Date(roomClose.epochMilliseconds);

      await roomClient.updateRoom(session.roomComsId, {
        validFrom,
        validUntil,
      });
    }

    return await orm.session.update({
      where: { id },
      data: {
        ...data,
        started: data.started?.toString(),
        completed: data.completed?.toString(),
        scheduled: scheduled
          ? new Date(scheduled.epochMilliseconds).toISOString()
          : undefined,
      },
    });
  },
});

export const setStartToNow = defineAction({
  input: z.string(),
  handler: async (roomId) => {
    const room = await roomClient.getRoom(roomId);
    const validUntil = new Date(room.validUntil);
    const validFrom = new Date();

    await roomClient
      .updateRoom(roomId, { validFrom, validUntil })
      .catch(console.error);

    await orm.session.update({
      where: { roomComsId: roomId },
      data: {
        scheduled: validFrom,
      },
    });

    return true;
  },
});

export type Sessions = Awaited<ReturnType<typeof getAll>>;
export type NewSessionSchema = z.infer<typeof SessionCreateSchema>;
export type SessionFromAll = Awaited<ReturnType<typeof getAll>>[number];
