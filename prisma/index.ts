import { PrismaClient } from "@prisma/client";
import { SurveyType as SurveyTypeEnum } from "@prisma/client";

export default new PrismaClient();
export const SurveyType = SurveyTypeEnum;
export type { Prisma as ORM } from "@prisma/client";
