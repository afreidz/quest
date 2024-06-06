import orm from "@hsalux/quest-db";
import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";

const include = {
  _count: {
    select: { systems: true },
  },
};

const schema = z.object({
  name: z.string().min(2).max(100),
});

export const getAll = defineAction({
  handler: async () => {
    return await orm.client.findMany({
      include,
    });
  },
});

export const create = defineAction({
  input: schema,
  handler: async (input, context) => {
    const user = (await getSession(context.request))?.user as User;
    return await orm.client.create({
      data: {
        name: input.name,
        createdBy: user.email!,
      },
      include,
    });
  },
});

export const getById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.client.findUnique({ where: { id }, include });
  },
});

export const updateById = defineAction({
  input: z.object({
    id: z.string(),
    data: schema,
  }),
  handler: async ({ id, data }) => {
    return await orm.client.update({
      data,
      include,
      where: { id },
    });
  },
});

export const deleteById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.client.delete({ where: { id } });
  },
});

export type Clients = Awaited<ReturnType<typeof getAll>>;
export type ClientById = Awaited<ReturnType<typeof getById>>;
export type ClientFromAll = Awaited<ReturnType<typeof getAll>>[number];
