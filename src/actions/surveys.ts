import orm from "@hsalux/quest-db";
import { defineAction } from "astro:actions";

const include = {};

export const getAll = defineAction({
  handler: async () => {
    return await orm.survey.findMany({
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
    });
  },
});

export type Surveys = Awaited<ReturnType<typeof getAll>>;
export type SurveyFromAll = Awaited<ReturnType<typeof getAll>>[number];
