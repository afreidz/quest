import orm from "@hsalux/quest-db";
import { defineAction, z } from "astro:actions";
import { PaginationSchema } from "@/utilities/actions";

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
    }
  )
  .refine((data) => (!!data.systems ? !data.clients?.length : true), {
    message: "If 'system' is defined, 'client' must be undefined",
  });

export const getAll = defineAction({
  input: PaginationSchema,
  handler: async (pagination) => {
    return await orm.session.findMany({
      orderBy: { createdAt: "asc" },
      skip: pagination?.skip,
      take: pagination?.take,
    });
  },
});

export const getById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.session.findFirst({ where: { id } });
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
    });
  },
});

export type Sessions = Awaited<ReturnType<typeof getAll>>;
export type SessionFromAll = Awaited<ReturnType<typeof getAll>>[number];
