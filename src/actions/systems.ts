import orm from "@hsalux/quest-db";
import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";

const include = {
  client: true,
  respondents: true,
  _count: {
    select: { revisions: true },
  },
};

const schema = z.object({
  clientId: z.string(),
  title: z.string().min(2).max(100),
});

export const getAll = defineAction({
  handler: async () => {
    return await orm.system.findMany({
      include,
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
      include,
    });
  },
});

export const getByClientId = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.system.findMany({ where: { clientId: id }, include });
  },
});

export const getById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.system.findUnique({ where: { id }, include });
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
      include,
      where: { id },
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
