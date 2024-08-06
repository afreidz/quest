import { z } from "astro:actions";

export const PaginationSchema = z
  .object({
    take: z.number().optional().default(500),
    skip: z.number().optional(),
  })
  .optional();
