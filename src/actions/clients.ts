import orm from "@hsalux/quest-db";
import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";
import { PaginationSchema } from "@/utilities/actions";

const include = {
  _count: {
    select: { systems: true },
  },
  systems: true,
};

const schema = z.object({
  name: z.string().min(2).max(100),
});

export const getAll = defineAction({
  input: PaginationSchema,
  handler: async (pagination) => {
    const clients = await orm.client
      .findMany({
        orderBy: { createdAt: "asc" },
        take: pagination?.take,
        skip: pagination?.skip,
        include,
      })
      .catch((err) => {
        console.error(err);
        return [];
      });

    return clients;
  },
});

export const create = defineAction({
  input: schema,
  handler: async (input, context) => {
    const user = (await getSession(context.request))?.user as User;
    return await orm.client
      .create({
        data: {
          name: input.name,
          createdBy: user.email!,
        },
        include,
      })
      .catch((err) => {
        console.error(err);
        return null;
      });
  },
});

export const getById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.client
      .findUnique({ where: { id }, include })
      .catch((err) => {
        console.error(err);
        return null;
      });
  },
});

export const updateById = defineAction({
  input: z.object({
    id: z.string(),
    data: schema,
  }),
  handler: async ({ id, data }) => {
    return await orm.client
      .update({
        data,
        include,
        where: { id },
      })
      .catch((err) => {
        console.error(err);
        return null;
      });
  },
});

export const deleteById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.client.delete({ where: { id } }).catch((err) => {
      console.error(err);
      return null;
    });
  },
});

export type Clients = Awaited<
  ReturnType<typeof orm.client.findMany<{ include: typeof include }>>
>;

export type ClientById = Clients[number];
export type ClientFromAll = Clients[number];
