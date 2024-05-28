import orm from "@hsalux/quest-db";
import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z, getApiContext } from "astro:actions";

const include = {
  surveys: true,
  responses: {
    include: {
      question: true,
      response: true,
    },
  },
};

const respondentSchema = z.object({
  systemId: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  title: z.string().optional(),
  profile: z.string().optional(),
  imageURL: z.string().optional(),
});

export const getAll = defineAction({
  handler: async () => {
    return await orm.respondent.findMany({
      include,
    });
  },
});

export const create = defineAction({
  input: respondentSchema,
  handler: async (input) => {
    const context = getApiContext();
    const user = (await getSession(context.request))?.user as User;

    const system = await orm.system.findFirst({
      where: { id: input.systemId },
      include: { revisions: true },
    });

    if (!system) throw new Error("Unable to locate system for respondent");

    const surveyConnections: { id: string }[] = [];

    system.revisions.forEach((r) => {
      if (r.surveyId) surveyConnections.push({ id: r.surveyId });
      if (r.checklistId) surveyConnections.push({ id: r.checklistId });
    });

    return await orm.respondent.create({
      data: {
        ...input,
        revisions: {
          connect: system.revisions.map((r) => ({ id: r.id })),
        },
        createdBy: user.email!,
        surveys: {
          connect: surveyConnections,
        },
      },
      include,
    });
  },
});

export const getById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.respondent.findUnique({ where: { id }, include });
  },
});

export const getBySystemId = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.respondent.findMany({ where: { systemId: id }, include });
  },
});

export const updateById = defineAction({
  input: z.object({
    id: z.string(),
    data: respondentSchema,
  }),
  handler: async ({ id, data }) => {
    return await orm.respondent.update({
      data,
      include,
      where: { id },
    });
  },
});

export const deleteById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.respondent.delete({ where: { id } });
  },
});

export type Respondents = Awaited<ReturnType<typeof getAll>>;
export type RespondentFromAll = Respondents[number];
