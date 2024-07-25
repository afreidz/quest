import { PrismaClient } from "@prisma/client";

const orm = new PrismaClient();

await orm.$transaction([
  orm.session.deleteMany(),
  orm.curratedResponse.deleteMany(),
  orm.questionGroup.deleteMany(),
  orm.respondent.deleteMany(),
  orm.response.deleteMany(),
  orm.question.deleteMany(),
  orm.survey.deleteMany(),
  orm.client.deleteMany(),
]);

const susCurratedResponses = await orm.curratedResponse.createManyAndReturn({
  data: [
    {
      position: 1,
      createdBy: "system@seed.com",
      label: "Strongly Agree",
      value: "strongly_agree",
      numericalValue: 5,
      types: ["SUS_CURRENT", "SUS_PROPOSED"],
    },
    {
      position: 2,
      createdBy: "system@seed.com",
      label: "Agree",
      value: "agree",
      numericalValue: 4,
      types: ["SUS_CURRENT", "SUS_PROPOSED"],
    },
    {
      position: 3,
      createdBy: "system@seed.com",
      label: "Neutral",
      value: "neutral",
      numericalValue: 3,
      types: ["SUS_CURRENT", "SUS_PROPOSED"],
    },
    {
      position: 4,
      createdBy: "system@seed.com",
      label: "Disagree",
      value: "disagree",
      numericalValue: 2,
      types: ["SUS_CURRENT", "SUS_PROPOSED"],
    },
    {
      position: 5,
      createdBy: "system@seed.com",
      label: "Strongly Disagree",
      value: "strongly_disagree",
      numericalValue: 1,
      types: ["SUS_CURRENT", "SUS_PROPOSED"],
    },
  ],
});

const checklistCurratedResponses =
  await orm.curratedResponse.createManyAndReturn({
    data: [
      {
        position: 1,
        createdBy: "system@seed.com",
        label: "Passed",
        value: "passed",
        numericalValue: 3,
        types: ["CHECKLIST"],
      },
      {
        position: 2,
        createdBy: "system@seed.com",
        label: "Delayed",
        value: "delayed",
        numericalValue: 2,
        types: ["CHECKLIST"],
      },
      {
        position: 3,
        createdBy: "system@seed.com",
        label: "Prompted",
        value: "prompted",
        numericalValue: 1,
        types: ["CHECKLIST"],
      },
      {
        position: 4,
        createdBy: "system@seed.com",
        label: "Failed",
        value: "failed",
        numericalValue: 0,
        types: ["CHECKLIST"],
      },
      {
        position: 5,
        createdBy: "system@seed.com",
        label: "Skipped",
        value: "na",
        numericalValue: null,
        types: ["CHECKLIST"],
      },
    ],
  });

const currentQuestions = await orm.$transaction([
  orm.question.create({
    data: {
      position: 1,
      positive: true,
      type: "SUS_CURRENT",
      createdBy: "system@seed.com",
      text: "I like to use the current system frequently.",
      positive: true,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 2,
      positive: false,
      type: "SUS_CURRENT",
      createdBy: "system@seed.com",
      text: "I find the current system unnecessarily complex.",
      positive: false,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 3,
      type: "SUS_CURRENT",
      createdBy: "system@seed.com",
      text: "I think the current system is easy to use.",
      positive: true,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 4,
      type: "SUS_CURRENT",
      createdBy: "system@seed.com",
      text: "I have needed the support of a technical person to be able to use the current system.",
      positive: false,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 5,
      type: "SUS_CURRENT",
      createdBy: "system@seed.com",
      text: "I find the various functions in the current system are well integrated.",
      positive: true,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 6,
      type: "SUS_CURRENT",
      createdBy: "system@seed.com",
      text: "I think there is too much inconsistency in the current system",
      positive: false,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 7,
      type: "SUS_CURRENT",
      createdBy: "system@seed.com",
      text: "I imagine that most people would learn to use the current system very quickly.",
      positive: true,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 8,
      type: "SUS_CURRENT",
      createdBy: "system@seed.com",
      text: "I find the current system very cumbersome to use.",
      positive: false,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 9,
      type: "SUS_CURRENT",
      createdBy: "system@seed.com",
      text: "I feel very confident using the current system.",
      positive: true,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 10,
      type: "SUS_CURRENT",
      createdBy: "system@seed.com",
      text: "I needed to learn a lot of things before I could get going with the current system.",
      positive: false,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
]);

const proposedQuestions = await orm.$transaction([
  orm.question.create({
    data: {
      position: 1,
      type: "SUS_PROPOSED",
      createdBy: "system@seed.com",
      text: "I think that I would like to use this system frequently.",
      positive: true,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 2,
      type: "SUS_PROPOSED",
      createdBy: "system@seed.com",
      text: "I found the system unnecessarily complex.",
      positive: false,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 3,
      type: "SUS_PROPOSED",
      createdBy: "system@seed.com",
      text: "I thought the system was easy to use.",
      positive: true,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 4,
      type: "SUS_PROPOSED",
      createdBy: "system@seed.com",
      text: "I think that I would need the support of a technical person to be able to use this system.",
      positive: false,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 5,
      type: "SUS_PROPOSED",
      createdBy: "system@seed.com",
      text: "I found the various functions in this system were well integrated.",
      positive: true,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 6,
      type: "SUS_PROPOSED",
      createdBy: "system@seed.com",
      text: "I thought there was too much inconsistency in this system.",
      positive: false,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 7,
      type: "SUS_PROPOSED",
      createdBy: "system@seed.com",
      text: "I would imagine that most people would learn to use this system very quickly.",
      positive: true,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 8,
      type: "SUS_PROPOSED",
      createdBy: "system@seed.com",
      text: "I found the system very cumbersome to use.",
      positive: false,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 9,
      type: "SUS_PROPOSED",
      createdBy: "system@seed.com",
      text: "I felt very confident using the system.",
      positive: true,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 10,
      type: "SUS_PROPOSED",
      createdBy: "system@seed.com",
      text: "I needed to learn a lot of things before I could get going with this system.",
      positive: false,
      responseOptions: {
        connect: susCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
]);

const heroFinderPrototypeChecklistGroups = await orm.$transaction([
  orm.questionGroup.create({
    data: {
      position: 2,
      text: "Access",
      createdBy: "system@seed.com",
    },
  }),
  orm.questionGroup.create({
    data: {
      position: 1,
      text: "Find by keyword",
      createdBy: "system@seed.com",
    },
  }),
  orm.questionGroup.create({
    data: {
      position: 3,
      text: "Find by browse",
      createdBy: "system@seed.com",
    },
  }),
  orm.questionGroup.create({
    data: {
      position: 4,
      text: "Send Help Request",
      createdBy: "system@seed.com",
    },
  }),
]);

const heroFinderCurrentChecklistGroups = await orm.$transaction([
  orm.questionGroup.create({
    data: {
      position: 2,
      text: "Access",
      createdBy: "system@seed.com",
    },
  }),
  orm.questionGroup.create({
    data: {
      position: 1,
      text: "Find by keyword",
      createdBy: "system@seed.com",
    },
  }),
  orm.questionGroup.create({
    data: {
      position: 3,
      text: "Find by browse",
      createdBy: "system@seed.com",
    },
  }),
  orm.questionGroup.create({
    data: {
      position: 4,
      text: "Send Help Request",
      createdBy: "system@seed.com",
    },
  }),
]);

const heroFinderCurrentChecklistQuestions = await orm.$transaction([
  orm.question.create({
    data: {
      position: 1,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: "Locate/Launch the HeroFinderPRO Application",
      group: { connect: { id: heroFinderCurrentChecklistGroups[0].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 2,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: "Locate the login button",
      group: { connect: { id: heroFinderCurrentChecklistGroups[0].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 3,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: "Login using email address and password",
      group: { connect: { id: heroFinderCurrentChecklistGroups[0].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 1,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: "Locate the keyword search",
      group: { connect: { id: heroFinderCurrentChecklistGroups[1].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 2,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Locate Hero "Superman" with search',
      group: { connect: { id: heroFinderCurrentChecklistGroups[1].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 3,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Filter all heros by "cape" with search',
      group: { connect: { id: heroFinderCurrentChecklistGroups[1].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 1,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Locate the "Caped" category link',
      group: { connect: { id: heroFinderCurrentChecklistGroups[2].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 2,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Locate "Superman" and navigate to the details page',
      group: { connect: { id: heroFinderCurrentChecklistGroups[2].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 1,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Locate "Superman" and navigate to the details page',
      group: { connect: { id: heroFinderCurrentChecklistGroups[3].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 2,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Find the status of your "Superman" a request',
      group: { connect: { id: heroFinderCurrentChecklistGroups[3].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 3,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Send "Superman" a request for help',
      group: { connect: { id: heroFinderCurrentChecklistGroups[3].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
]);

const heroFinderPrototypeChecklistQuestions = await orm.$transaction([
  orm.question.create({
    data: {
      position: 1,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: "Locate/Launch the HeroFinderPRO Application",
      group: { connect: { id: heroFinderPrototypeChecklistGroups[0].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 2,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: "Locate the login button",
      group: { connect: { id: heroFinderPrototypeChecklistGroups[0].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 3,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: "Login using email address and password",
      group: { connect: { id: heroFinderPrototypeChecklistGroups[0].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 1,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: "Locate the keyword search",
      group: { connect: { id: heroFinderPrototypeChecklistGroups[1].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 2,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Locate Hero "Superman" with search',
      group: { connect: { id: heroFinderPrototypeChecklistGroups[1].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 3,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Filter all heros by "cape" with search',
      group: { connect: { id: heroFinderPrototypeChecklistGroups[1].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 1,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Locate the "Caped" category link',
      group: { connect: { id: heroFinderPrototypeChecklistGroups[2].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 2,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Locate "Superman" and navigate to the details page',
      group: { connect: { id: heroFinderPrototypeChecklistGroups[2].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 1,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Locate "Superman" and navigate to the details page',
      group: { connect: { id: heroFinderPrototypeChecklistGroups[3].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 2,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Find the status of your "Superman" a request',
      group: { connect: { id: heroFinderPrototypeChecklistGroups[3].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
  orm.question.create({
    data: {
      position: 3,
      type: "CHECKLIST",
      createdBy: "system@seed.com",
      text: 'Send "Superman" a request for help',
      group: { connect: { id: heroFinderPrototypeChecklistGroups[3].id } },
      responseOptions: {
        connect: checklistCurratedResponses.map((r) => ({ id: r.id })),
      },
    },
  }),
]);

const marvelClient = await orm.client.create({
  data: {
    name: "Marvel Inc.",
    createdBy: "system@seed.com",
  },
});

const heroFinderSystem = await orm.system.create({
  data: {
    title: "HeroFinderPRO",
    clientId: marvelClient.id,
    createdBy: "system@seed.com",
  },
});

const currentStateRevision = await orm.revision.create({
  data: {
    title: "Current State",
    createdBy: "system@seed.com",
    systemId: heroFinderSystem.id,
  },
});

const prototypeRevision = await orm.revision.create({
  data: {
    title: "Prototype V1",
    createdBy: "system@seed.com",
    systemId: heroFinderSystem.id,
  },
});

const heroFinderCurrentStateSurvey = await orm.survey.create({
  data: {
    type: "SUS_CURRENT",
    createdBy: "system@seed.com",
    revisionAsSurvey: { connect: { id: currentStateRevision.id } },
    questions: { connect: currentQuestions.map((q) => ({ id: q.id })) },
  },
});

const heroFinderPrototypeSurvey = await orm.survey.create({
  data: {
    type: "SUS_PROPOSED",
    createdBy: "system@seed.com",
    revisionAsSurvey: { connect: { id: prototypeRevision.id } },
    questions: { connect: proposedQuestions.map((q) => ({ id: q.id })) },
  },
});

const heroFinderPrototypeChecklist = await orm.survey.create({
  data: {
    type: "CHECKLIST",
    createdBy: "system@seed.com",
    revisionAsChecklist: { connect: { id: prototypeRevision.id } },
    questions: {
      connect: heroFinderPrototypeChecklistQuestions.map((q) => ({ id: q.id })),
    },
  },
});

const heroFinderCurrentChecklist = await orm.survey.create({
  data: {
    type: "CHECKLIST",
    createdBy: "system@seed.com",
    revisionAsChecklist: { connect: { id: currentStateRevision.id } },
    questions: {
      connect: heroFinderCurrentChecklistQuestions.map((q) => ({ id: q.id })),
    },
  },
});

const tonyStark = await orm.respondent.create({
  data: {
    email: "tony.stark@marvel.com",
    createdBy: "system@seed.com",
    revisions: {
      connect: [{ id: currentStateRevision.id }, { id: prototypeRevision.id }],
    },
    surveys: {
      connect: [
        { id: heroFinderCurrentStateSurvey.id },
        { id: heroFinderPrototypeSurvey.id },
        { id: heroFinderCurrentChecklist.id },
        { id: heroFinderPrototypeChecklist.id },
      ],
    },
  },
});

const bruceBanner = await orm.respondent.create({
  data: {
    email: "bruce.banner@marvel.com",
    createdBy: "system@seed.com",
    revisions: {
      connect: [{ id: currentStateRevision.id }, { id: prototypeRevision.id }],
    },
    surveys: {
      connect: [
        { id: heroFinderCurrentStateSurvey.id },
        { id: heroFinderPrototypeSurvey.id },
        { id: heroFinderCurrentChecklist.id },
        { id: heroFinderPrototypeChecklist.id },
      ],
    },
  },
});

await orm.$transaction([
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: currentQuestions[0].id,
      responseId: susCurratedResponses.find((r) => r.value === "neutral").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: currentQuestions[1].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: currentQuestions[2].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: currentQuestions[3].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: currentQuestions[4].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: currentQuestions[5].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: currentQuestions[6].id,
      responseId: susCurratedResponses.find((r) => r.value === "neutral").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: currentQuestions[7].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: currentQuestions[8].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: currentQuestions[9].id,
      responseId: susCurratedResponses.find((r) => r.value === "neutral").id,
    },
  }),
]);

await orm.$transaction([
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: currentQuestions[0].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: currentQuestions[1].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: currentQuestions[2].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: currentQuestions[3].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: currentQuestions[4].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: currentQuestions[5].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: currentQuestions[6].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: currentQuestions[7].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: currentQuestions[8].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentStateSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: currentQuestions[9].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
]);

await orm.$transaction([
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: proposedQuestions[0].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: proposedQuestions[1].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: proposedQuestions[2].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: proposedQuestions[3].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: proposedQuestions[4].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: proposedQuestions[5].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: proposedQuestions[6].id,
      responseId: susCurratedResponses.find((r) => r.value === "neutral").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: proposedQuestions[7].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: proposedQuestions[8].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: bruceBanner.id,
      questionId: proposedQuestions[9].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
]);

await orm.$transaction([
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: proposedQuestions[0].id,
      responseId: susCurratedResponses.find((r) => r.value === "strongly_agree")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: proposedQuestions[1].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: proposedQuestions[2].id,
      responseId: susCurratedResponses.find((r) => r.value === "strongly_agree")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: proposedQuestions[3].id,
      responseId: susCurratedResponses.find((r) => r.value === "neutral").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: proposedQuestions[4].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: proposedQuestions[5].id,
      responseId: susCurratedResponses.find((r) => r.value === "disagree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: proposedQuestions[6].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: proposedQuestions[7].id,
      responseId: susCurratedResponses.find(
        (r) => r.value === "strongly_disagree",
      ).id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: proposedQuestions[8].id,
      responseId: susCurratedResponses.find((r) => r.value === "agree").id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeSurvey.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: proposedQuestions[9].id,
      responseId: susCurratedResponses.find(
        (r) => r.value === "strongly_disagree",
      ).id,
    },
  }),
]);

await orm.$transaction([
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderPrototypeChecklistQuestions[0].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "passed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderPrototypeChecklistQuestions[1].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "passed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderPrototypeChecklistQuestions[2].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "prompted")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderPrototypeChecklistQuestions[3].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "passed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderPrototypeChecklistQuestions[4].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "delayed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderPrototypeChecklistQuestions[5].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "delayed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderPrototypeChecklistQuestions[6].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "delayed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderPrototypeChecklistQuestions[7].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "passed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderPrototypeChecklistQuestions[8].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "failed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderPrototypeChecklistQuestions[9].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "passed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderPrototypeChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderPrototypeChecklistQuestions[10].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "failed")
        .id,
    },
  }),
]);

await orm.$transaction([
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderCurrentChecklistQuestions[0].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "passed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderCurrentChecklistQuestions[1].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "passed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderCurrentChecklistQuestions[2].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "failed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderCurrentChecklistQuestions[3].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "passed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderCurrentChecklistQuestions[4].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "failed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderCurrentChecklistQuestions[5].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "delayed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderCurrentChecklistQuestions[6].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "delayed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderCurrentChecklistQuestions[7].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "delayed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderCurrentChecklistQuestions[8].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "failed")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderCurrentChecklistQuestions[9].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "prompted")
        .id,
    },
  }),
  orm.response.create({
    data: {
      surveyId: heroFinderCurrentChecklist.id,
      createdBy: "system@seed.com",
      respondentId: tonyStark.id,
      questionId: heroFinderCurrentChecklistQuestions[10].id,
      responseId: checklistCurratedResponses.find((r) => r.value === "na").id,
    },
  }),
]);
