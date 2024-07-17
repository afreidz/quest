import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";
import orm, { SurveyType } from "@hsalux/quest-db";
import { PaginationSchema } from "@/utilities/actions";

const include = {
  system: true,
  survey: {
    include: {
      questions: {
        include: {
          group: true,
          responseOptions: {
            include: {
              responses: { include: { respondent: true } },
            },
          },
        },
      },
      revisionAsChecklist: {
        include: {
          system: { include: { client: true } },
        },
      },
      revisionAsSurvey: {
        include: {
          system: { include: { client: true } },
        },
      },
    },
  },
  checklist: {
    include: {
      questions: {
        include: {
          responseOptions: {
            include: {
              responses: true,
            },
          },
        },
      },
      revisionAsChecklist: {
        include: {
          system: { include: { client: true } },
        },
      },
      revisionAsSurvey: {
        include: {
          system: { include: { client: true } },
        },
      },
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
  title: z.string().min(3).max(100),
  surveyId: z.string().optional().nullable(),
  checklistId: z.string().optional().nullable(),
  surveyType: z.nativeEnum(SurveyType).optional(),
});

export const getAll = defineAction({
  input: PaginationSchema,
  handler: async (pagination) => {
    return await orm.revision.findMany({
      orderBy: { createdAt: "asc" },
      take: pagination?.take,
      skip: pagination?.skip,
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

      return await orm.revision.create({
        data: {
          title: input.title,
          system: { connect: { id: input.systemId } },
          createdBy: user.email!,
          survey: {
            create: {
              type: input.surveyType,
              createdBy: "system@seed.com",
              questions: {
                connect: questions.map((q) => ({ id: q.id })),
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
    return await orm.revision.findMany({
      orderBy: { createdAt: "asc" },
      where: { systemId: id },
      include,
    });
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
export type SurveyFromRevision = NonNullable<RevisionFromAll["survey"]>;
