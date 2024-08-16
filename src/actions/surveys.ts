import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";
import orm, { type ORM } from "@hsalux/quest-db";
import { PaginationSchema } from "@/utilities/actions";

const include = {
  _count: {
    select: { questions: true },
  },
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
      respondents: true,
      system: { include: { client: true } },
    },
  },
  revisionAsSurvey: {
    include: {
      respondents: true,
      system: { include: { client: true } },
    },
  },
};

const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  responses: z.any(),
  positive: z.boolean(),
  group: z.string().nullable(),
  position: z.number().nullable(),
});

const groupSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  image: z.string().nullable(),
  position: z.number().nullable(),
  questions: z.array(questionSchema).optional(),
});

const surveySchema = z.object({
  groups: z.object({
    new: z.array(groupSchema).optional(),
    changed: z.array(groupSchema).optional(),
    removed: z.array(groupSchema).optional(),
    unchanged: z.array(groupSchema).optional(),
  }),
  questions: z.object({
    new: z.array(questionSchema).optional(),
    changed: z.array(questionSchema).optional(),
    removed: z.array(questionSchema).optional(),
    unchanged: z.array(questionSchema).optional(),
  }),
});

const responseSchema = z.object({
  survey: z.string(),
  question: z.string(),
  respondent: z.string(),
  response: z.string().optional(),
  freeForm: z.string().optional(),
});

export const create = defineAction({
  input: z.string(),
  handler: async (id, context) => {
    const user = (await getSession(context.request))?.user as User;
    const existing = await orm.survey.findFirst({
      where: { revisionAsChecklist: { id } },
    });

    if (existing) throw new Error(`Revision "${id}" already has a checklist`);

    const respondents = await orm.respondent.findMany({
      where: { revisions: { some: { id } } },
    });

    return await orm.survey.create({
      data: {
        type: "CHECKLIST",
        createdBy: user.email!,
        revisionAsChecklist: { connect: { id } },
        respondents: { connect: respondents.map((r) => ({ id: r.id })) },
      },
    });
  },
});

export const getAll = defineAction({
  input: PaginationSchema,
  handler: async (pagination) => {
    return await orm.survey.findMany({
      orderBy: { createdAt: "asc" },
      take: pagination?.take,
      skip: pagination?.skip,
      include,
    });
  },
});

export const getById = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.survey.findFirst({ where: { id }, include });
  },
});

export const getResponsesByRespondent = defineAction({
  input: z.object({
    survey: z.string(),
    respondent: z.string(),
  }),
  handler: async ({ survey, respondent }) => {
    return await orm.response.findMany({
      where: { respondentId: respondent, surveyId: survey },
    });
  },
});

export const respondToQuestion = defineAction({
  input: responseSchema,
  handler: async (data, context) => {
    const user = (await getSession(context.request))?.user as User;
    return await orm.response.upsert({
      where: {
        respondentId_surveyId_questionId: {
          respondentId: data.respondent,
          surveyId: data.survey,
          questionId: data.question,
        },
      },
      update: {
        responseId: data.response,
        freeformResponse: data.freeForm,
      },
      create: {
        surveyId: data.survey,
        questionId: data.question,
        responseId: data.response,
        respondentId: data.respondent,
        freeformResponse: data.freeForm,
        createdBy: user?.email ?? "system@quest.hsalux.app",
      },
    });
  },
});

export const completeSurvey = defineAction({
  input: z.object({
    survey: z.string(),
    respondent: z.string(),
  }),
  handler: async (input) => {
    return await orm.completedSurveys.upsert({
      where: {
        surveyId_respondentId: {
          surveyId: input.survey,
          respondentId: input.respondent,
        },
      },
      update: {},
      create: {
        surveyId: input.survey,
        respondentId: input.respondent,
      },
    });
  },
});

export const resetSurveyCompletion = defineAction({
  input: z.object({
    survey: z.string(),
    respondent: z.string(),
  }),
  handler: async (input) => {
    return await orm.completedSurveys.delete({
      where: {
        surveyId_respondentId: {
          surveyId: input.survey,
          respondentId: input.respondent,
        },
      },
    });
  },
});

export const updateChecklistById = defineAction({
  input: z.object({
    id: z.string(),
    data: surveySchema,
  }),
  handler: async ({ id, data }, context) => {
    const survey = await orm.survey.findFirst({ where: { id } });
    const user = (await getSession(context.request))?.user as User;
    const responseOptions = await orm.curratedResponse.findMany({
      where: { types: { has: "CHECKLIST" } },
    });

    if (!survey || survey.type !== "CHECKLIST")
      throw new Error(`Unable to update survey "${id}"`);

    return await orm.$transaction([
      orm.survey.update({
        where: { id: survey.id },
        data: {
          questions: {
            disconnect: (data.questions.removed ?? []).map((q) => ({
              id: q.id,
            })),
          },
        },
      }),
      ...(data.groups.changed ?? []).map((group) => {
        return orm.questionGroup.update({
          where: { id: group.id },
          data: {
            position: group.position,
            imageURL: group.image,
            text: group.name,
          },
        });
      }),
      ...(data.questions.changed ?? []).map((question) => {
        return orm.question.update({
          where: { id: question.id },
          data: {
            text: question.text,
            groupId: question.group,
            position: question.position,
            positive: question.positive,
          },
        });
      }),
      ...(data.questions.new ?? []).map((question) => {
        const newGroup = data.groups.new?.find((g) => g.id === question.group);
        return orm.question.create({
          data: {
            type: survey.type,
            text: question.text,
            createdBy: user.email!,
            surveys: {
              connect: { id: survey.id },
            },
            responseOptions: {
              connect: responseOptions.map((r) => ({ id: r.id })),
            },
            position: question.position,
            positive: question.positive,
            group: {
              connectOrCreate: {
                where: { id: question.group ?? undefined },
                create: {
                  text: newGroup?.name ?? "FOO",
                  createdBy: user.email!,
                  imageURL: newGroup?.image,
                  position: newGroup?.position,
                },
              },
            },
          },
        });
      }),
    ]);
  },
});

export const deleteById = defineAction({
  input: z.string(),
  async handler(id) {
    const survey = await orm.survey.findFirst({ where: { id } });
    if (!survey || survey.type !== "CHECKLIST")
      throw new Error(`Unable to delete survey: ${id}`);

    return await orm.survey.delete({ where: { id } });
  },
});

export type Surveys = Awaited<
  ReturnType<typeof orm.survey.findMany<{ include: typeof include }>>
>;
export type SurveyFromAll = Surveys[number];

export type ResponsesByRespondent = Awaited<
  ReturnType<typeof orm.response.findMany>
>;
