import { z } from 'zod';

export const nameSchema = z.string().trim().min(1, "Name is required").max(255, "Name must be less than 255 characters");
export const descriptionSchema = z.string().trim().max(1000, "Description must be less than 1000 characters").optional();

export const createWorkspaceSchema = z.object({
    name: nameSchema,
    description: descriptionSchema
});

export const updateWorkspaceSchema = z.object({
    name: nameSchema,
    description: descriptionSchema
});
