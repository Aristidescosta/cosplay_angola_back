import z from "zod";

export const createTagSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    category: z.enum(["CHARACTER", "SERIES", "EVENT", "PHOTOGRAPHER", "STYLE", "OTHER"]).default("OTHER")
})

export const updateTagSchema = z.object({
    name: z.string().min(1).optional(),
    category: z.enum(["CHARACTER", "SERIES", "EVENT", "PHOTOGRAPHER", "STYLE", "OTHER"]).optional()
})

export const filterSchema = z.object({
    category: z.enum(["CHARACTER", "SERIES", "EVENT", "PHOTOGRAPHER", "STYLE", "OTHER"]).optional(),
    search: z.string().optional(),
    sortBy: z.enum(["name", "popularity"]).default("name").optional(),
    limit: z.coerce.number().default(20),
    page: z.coerce.number().default(1)
})

export type CreateTag = z.infer<typeof createTagSchema>;
export type UpdateTag = z.infer<typeof updateTagSchema>;
export type FilterTag = z.infer<typeof filterSchema>;