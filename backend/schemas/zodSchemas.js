const { z } = require('zod');

const officialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  position: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  term_of_service: z.string().optional().nullable(),
});

const termSchema = z.object({
  name: z.string().min(2, "Term name must be at least 2 characters"),
  year: z.string().regex(/^\d{4}(-\d{4})?$/, "Invalid year format (e.g. 2024 or 2024-2025)"),
  start_date: z.string().pipe(z.coerce.date()),
  end_date: z.string().optional().nullable().pipe(z.coerce.date().nullable()),
  description: z.string().optional().nullable(),
  set_as_current: z.boolean().optional(),
});

module.exports = {
  officialSchema,
  termSchema,
};
