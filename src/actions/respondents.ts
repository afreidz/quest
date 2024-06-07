import orm from "@hsalux/quest-db";
import type { User } from "@auth/core/types";
import { getSession } from "auth-astro/server";
import { defineAction, z } from "astro:actions";

const include = {
  systems: true,
  surveys: {
    include: {
      questions: true,
      _count: {
        select: { questions: true },
      },
    },
  },
  _count: { select: { revisions: true, responses: true, systems: true } },
  revisions: true,
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
  systemId: z.string().optional(),
  imageURL: z.string().optional(),
});

export const getAll = defineAction({
  handler: async () => {
    return await orm.respondent.findMany({
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

    const system = await orm.system.findFirst({
      where: { id: input.systemId },
      include: { revisions: true },
    });

    const surveyConnections: { id: string }[] = [];
    const systemConnections: { id: string }[] = [];
    const revisionConnections: { id: string }[] = [];

    if (system) {
      systemConnections.push({ id: system.id });
      system.revisions.forEach((r) => {
        revisionConnections.push({ id: r.id });
        if (r.surveyId) surveyConnections.push({ id: r.surveyId });
        if (r.checklistId) surveyConnections.push({ id: r.checklistId });
      });
    }

    return await orm.respondent.create({
      data: {
        ...input,
        createdBy: user.email!,
        revisions: {
          connect: revisionConnections,
        },
        systems: {
          connect: systemConnections,
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
    return await orm.respondent.findUnique({ where: { id }, include });
  },
});

export const getBySystemId = defineAction({
  input: z.string(),
  handler: async (id) => {
    return await orm.respondent.findMany({
      where: { systems: { some: { id } } },
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
        systems: {
          connect: systemIds.map((id) => ({ id })),
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
        systems: {
          disconnect: systemIds.map((id) => ({ id })),
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
        systems: {
          connect: systems.map((s) => ({ id: s.id })),
        },
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
