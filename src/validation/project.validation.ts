import { z } from "zod";
import { ProjectStatusEnum } from "../enums/project.enum";
import { nameSchema, descriptionSchema } from "./workspace.validation";

export const projectIdParamSchema = z.string().trim().min(1, "Project ID is required").max(255);
export const workspaceIdParamSchema = z.string().trim().min(1, "Workspace ID is required").max(255);

export const createProjectSchema = z.object({
    name: nameSchema,
    description: descriptionSchema,
    emoji: z.string().trim().max(16).optional(),
});

export const updateProjectSchema = z.object({
    name: nameSchema.optional(),
    description: descriptionSchema,
    status: z.enum([ProjectStatusEnum.ACTIVE, ProjectStatusEnum.ARCHIVED]).optional(),
    startDate: z.coerce.date().nullable().optional(),
    endDate: z.coerce.date().nullable().optional(),
});

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const listProjectsQuerySchema = paginationSchema.extend({
    status: z.enum([ProjectStatusEnum.ACTIVE, ProjectStatusEnum.ARCHIVED]).optional(),
});
