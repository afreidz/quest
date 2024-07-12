import orm from "@hsalux/quest-db";
import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";
import { PaginationSchema } from "@/utilities/actions";

const include = {
  surveys: {
    include: {
      questions: { include: { group: true } },
      _count: {
        select: { questions: true },
      },
    },
  },
  _count: { select: { revisions: true, responses: true } },
  revisions: {
    include: { system: true },
  },
  responses: {
    include: {
      question: true,
      response: true,
    },
  },
};

const respondentSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  title: z.string().optional(),
  profile: z.string().optional(),
  imageURL: z.string().optional(),
  revisionId: z.string().optional(),
});

export const getAll = defineAction({
  input: PaginationSchema,
  handler: async (pagination) => {
    return await orm.respondent.findMany({
      orderBy: { createdAt: "asc" },
      take: pagination?.take,
      skip: pagination?.skip,
      include,
    });
  },
});

export const getBySearch = defineAction({
  input: z.string(),
  handler: async (query) => {
    if (query.length <= 2) return [];
    return await orm.respondent.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      include,
    });
  },
});

export const create = defineAction({
  input: respondentSchema,
  handler: async (input, context) => {
    const user = (await getSession(context.request))?.user as User;

    const revision = await orm.revision.findFirst({
      where: { id: input.revisionId },
    });
    delete input.revisionId;

    const surveyConnections: { id: string }[] = [];
    const revisionConnections: { id: string }[] = [];

    if (revision) {
      revisionConnections.push({ id: revision.id });
      if (revision.surveyId) surveyConnections.push({ id: revision.surveyId });
      if (revision.checklistId)
        surveyConnections.push({ id: revision.checklistId });
    }

    return await orm.respondent.create({
      data: {
        ...input,
        createdBy: user.email!,
        revisions: {
          connect: revisionConnections,
        },
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
    return await orm.respondent.findUnique({
      where: { id },
      include,
    });
  },
});

export const getBySystemId = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.respondent.findMany({
      where: { revisions: { some: { systemId: id } } },
      include,
    });
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

export const addToSystems = defineAction({
  input: z.object({
    id: z.string(),
    systemIds: z.array(z.string()),
  }),
  handler: async ({ id, systemIds }) => {
    const revisions = await orm.revision.findMany({
      where: { systemId: { in: systemIds } },
    });

    return await orm.respondent.update({
      where: { id },
      data: {
        revisions: {
          connect: revisions.map((r) => ({ id: r.id })),
        },
      },
    });
  },
});

export const removeFromSystems = defineAction({
  input: z.object({
    id: z.string(),
    systemIds: z.array(z.string()),
  }),
  handler: async ({ id, systemIds }) => {
    const revisions = await orm.revision.findMany({
      where: { systemId: { in: systemIds } },
    });

    return await orm.respondent.update({
      where: { id },
      data: {
        revisions: {
          disconnect: revisions.map((r) => ({ id: r.id })),
        },
      },
    });
  },
});

export const addToRevisions = defineAction({
  input: z.object({
    id: z.string(),
    revisionIds: z.array(z.string()),
  }),
  handler: async ({ id, revisionIds }) => {
    const systems = await orm.system.findMany({
      where: { revisions: { some: { id: { in: revisionIds } } } },
    });

    return await orm.respondent.update({
      where: { id },
      data: {
        revisions: {
          connect: revisionIds.map((id) => ({ id })),
        },
      },
    });
  },
});

export const removeFromRevisions = defineAction({
  input: z.object({
    id: z.string(),
    revisionIds: z.array(z.string()),
  }),
  handler: async ({ id, revisionIds }) => {
    return await orm.respondent.update({
      where: { id },
      data: {
        revisions: {
          disconnect: revisionIds.map((id) => ({ id })),
        },
      },
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
