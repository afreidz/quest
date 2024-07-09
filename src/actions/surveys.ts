import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";
import orm, { type ORM } from "@hsalux/quest-db";

const include = {
  questions: {
    include: {
      group: true,
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
  handler: async () => {
    return await orm.survey.findMany({
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

export type Surveys = ORM.SurveyGetPayload<{ include: typeof include }>[];
export type SurveyFromAll = Surveys[number];
