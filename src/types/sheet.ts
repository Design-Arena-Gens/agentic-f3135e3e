import { z } from "zod";

export const SheetRowSchema = z.object({
  id: z.string().optional(),
  // Free-form text prompt or structured fields
  title: z.string().min(1, "title is required"),
  summary: z.string().optional().default(""),
  details: z.string().optional().default(""),
  category: z.string().optional(), // If provided by Sheets, used for folder classification
  // Optional control fields
  language: z.string().optional().default("en"),
  temperature: z.coerce.number().optional().default(0.2),
});

export type SheetRow = z.infer<typeof SheetRowSchema>;
