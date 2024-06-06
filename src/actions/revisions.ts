import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";
import orm, { SurveyType } from "@hsalux/quest-db";

const include = {
  system: true,
  survey: {
    include: {
      questions: { include: { responses: true, responseOptions: true } },
    },
  },
  respondents: {
    include: {
      surveys: {
        include: {
          _count: {
            select: { questions: true },
          },
        },
      },
      responses: { include: { response: true, question: true } },
    },
  },
};

const revisionSchema = z.object({
  systemId: z.string(),
  surveyId: z.string().optional(),
  title: z.string().min(3).max(100),
  checklistId: z.string().optional(),
  surveyType: z.nativeEnum(SurveyType).optional(),
});

export const getAll = defineAction({
  handler: async () => {
    return await orm.revision.findMany({
      include,
    });
  },
});

export const create = defineAction({
  input: revisionSchema,
  handler: async (input, context) => {
    const user = (await getSession(context.request))?.user as User;

    if (input.surveyType) {
      const questions = await orm.question.findMany({
        where: { type: input.surveyType },
      });

      const respondents = await orm.respondent.findMany({
        where: { systems: { some: { id: input.systemId } } },
      });

      return await orm.revision.create({
        data: {
          title: input.title,
          system: { connect: { id: input.systemId } },
          createdBy: user.email!,
          respondents: {
            connect: respondents.map((r) => ({ id: r.id })),
          },
          survey: {
            create: {
              type: input.surveyType,
              createdBy: "system@seed.com",
              questions: {
                connect: questions.map((q) => ({ id: q.id })),
              },
              respondents: {
                connect: respondents.map((r) => ({ id: r.id })),
              },
            },
          },
        },
        include,
      });
    } else {
      return await orm.revision.create({
        data: {
          ...input,
          createdBy: user.email!,
        },
        include,
      });
    }
  },
});

export const getById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.revision.findUnique({ where: { id }, include });
  },
});

export const getBySystemId = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.revision.findMany({ where: { systemId: id }, include });
  },
});

export const updateById = defineAction({
  input: z.object({
    id: z.string(),
    data: revisionSchema,
  }),
  handler: async ({ id, data }) => {
    return await orm.revision.update({
      data,
      include,
      where: { id },
    });
  },
});

export const deleteById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.revision.delete({ where: { id } });
  },
});

export type Revisions = Awaited<ReturnType<typeof getAll>>;
export type RevisionFromAll = Revisions[number];
