import orm from "@hsalux/quest-db";
import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";
import { PaginationSchema } from "@/utilities/actions";

const schema = z.object({
  clientId: z.string(),
  title: z.string().min(2).max(100),
});

export const getAll = defineAction({
  input: PaginationSchema,
  handler: async (pagination) => {
    return await orm.system.findMany({
      orderBy: { createdAt: "asc" },
      take: pagination?.take,
      skip: pagination?.skip,
      include: { client: true, revisions: { orderBy: { createdAt: "asc" } } },
    });
  },
});

export const create = defineAction({
  input: schema,
  handler: async (input, context) => {
    const user = (await getSession(context.request))?.user as User;
    return await orm.system.create({
      data: {
        ...input,
        createdBy: user.email!,
      },
      include: { client: true, revisions: { orderBy: { createdAt: "asc" } } },
    });
  },
});

export const getByClientId = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.system.findMany({
      where: { clientId: id },
      include: { client: true, revisions: { orderBy: { createdAt: "asc" } } },
    });
  },
});

export const getById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.system.findFirst({
      where: { id },
      include: { client: true, revisions: { orderBy: { createdAt: "asc" } } },
    });
  },
});

export const updateById = defineAction({
  input: z.object({
    id: z.string(),
    data: schema,
  }),
  handler: async ({ id, data }) => {
    return await orm.system.update({
      data,
      where: { id },
      include: { client: true, revisions: { orderBy: { createdAt: "asc" } } },
    });
  },
});

export const deleteById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.system.delete({ where: { id } });
  },
});

export type Systems = Awaited<ReturnType<typeof getAll>>;
export type SystemFromAll = Systems[number];
