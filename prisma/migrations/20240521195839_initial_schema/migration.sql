-- CreateEnum
CREATE TYPE "SurveyType" AS ENUM ('SUS_CURRENT', 'SUS_PROPOSED', 'CHECKLIST');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "System" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "System_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revision" (
    "id" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,

    CONSTRAINT "Revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Respondent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "imageURL" TEXT,
    "name" TEXT,
    "title" TEXT,
    "profile" TEXT,
    "systemId" TEXT NOT NULL,

    CONSTRAINT "Respondent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "SurveyType" NOT NULL,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "position" INTEGER,
    "text" TEXT NOT NULL,
    "group" TEXT,
    "imageURL" TEXT,
    "positive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurratedResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "position" INTEGER,
    "numericalValue" INTEGER,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "CurratedResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "freeformResponse" TEXT,
    "responseId" TEXT,
    "respondentId" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RespondentToSurvey" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_RespondentToRevision" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_QuestionToSurvey" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CurratedResponseToQuestion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");

-- CreateIndex
CREATE UNIQUE INDEX "System_clientId_title_key" ON "System"("clientId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Revision_surveyId_key" ON "Revision"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "Revision_checklistId_key" ON "Revision"("checklistId");

-- CreateIndex
CREATE UNIQUE INDEX "Revision_systemId_title_key" ON "Revision"("systemId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Respondent_email_systemId_key" ON "Respondent"("email", "systemId");

-- CreateIndex
CREATE UNIQUE INDEX "Response_respondentId_surveyId_questionId_key" ON "Response"("respondentId", "surveyId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "_RespondentToSurvey_AB_unique" ON "_RespondentToSurvey"("A", "B");

-- CreateIndex
CREATE INDEX "_RespondentToSurvey_B_index" ON "_RespondentToSurvey"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RespondentToRevision_AB_unique" ON "_RespondentToRevision"("A", "B");

-- CreateIndex
CREATE INDEX "_RespondentToRevision_B_index" ON "_RespondentToRevision"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_QuestionToSurvey_AB_unique" ON "_QuestionToSurvey"("A", "B");

-- CreateIndex
CREATE INDEX "_QuestionToSurvey_B_index" ON "_QuestionToSurvey"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CurratedResponseToQuestion_AB_unique" ON "_CurratedResponseToQuestion"("A", "B");

-- CreateIndex
CREATE INDEX "_CurratedResponseToQuestion_B_index" ON "_CurratedResponseToQuestion"("B");

-- AddForeignKey
ALTER TABLE "System" ADD CONSTRAINT "System_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respondent" ADD CONSTRAINT "Respondent_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "CurratedResponse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "Respondent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RespondentToSurvey" ADD CONSTRAINT "_RespondentToSurvey_A_fkey" FOREIGN KEY ("A") REFERENCES "Respondent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RespondentToSurvey" ADD CONSTRAINT "_RespondentToSurvey_B_fkey" FOREIGN KEY ("B") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RespondentToRevision" ADD CONSTRAINT "_RespondentToRevision_A_fkey" FOREIGN KEY ("A") REFERENCES "Respondent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RespondentToRevision" ADD CONSTRAINT "_RespondentToRevision_B_fkey" FOREIGN KEY ("B") REFERENCES "Revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionToSurvey" ADD CONSTRAINT "_QuestionToSurvey_A_fkey" FOREIGN KEY ("A") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionToSurvey" ADD CONSTRAINT "_QuestionToSurvey_B_fkey" FOREIGN KEY ("B") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CurratedResponseToQuestion" ADD CONSTRAINT "_CurratedResponseToQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "CurratedResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CurratedResponseToQuestion" ADD CONSTRAINT "_CurratedResponseToQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
