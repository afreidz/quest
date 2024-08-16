-- CreateTable
CREATE TABLE "CompletedSurveys" (
    "surveyId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,

    CONSTRAINT "CompletedSurveys_pkey" PRIMARY KEY ("surveyId","respondentId")
);

-- AddForeignKey
ALTER TABLE "CompletedSurveys" ADD CONSTRAINT "CompletedSurveys_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "Respondent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedSurveys" ADD CONSTRAINT "CompletedSurveys_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
