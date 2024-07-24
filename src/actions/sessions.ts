import orm from "@hsalux/quest-db";
import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";
import { PaginationSchema } from "@/utilities/actions";

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
    const user = (await getSession(context.request))?.user as User;
    const scheduled = new Date(sessionData.scheduled).toUTCString();

    return orm.session.create({
      data: {
        createdBy: user.email!,
        moderator: sessionData.moderator,
        revisionId: sessionData.revision,
        respondentId: sessionData.respondent,
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
