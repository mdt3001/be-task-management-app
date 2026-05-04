import { changeWorkspaceMemberRoleController } from './../controllers/workspace.controller';
import { z } from 'zod';

export const nameSchema = z.string().trim().min(1, "Name is required").max(255, "Name must be less than 255 characters");
export const descriptionSchema = z.string().trim().max(1000, "Description must be less than 1000 characters").optional();

export const createWorkspaceSchema = z.object({
    name: nameSchema,
    description: descriptionSchema
});

export const getWorkspaceByIdSchema = z.string().trim().min(1, "Workspace ID is required").max(255, "Workspace ID must be less than 255 characters");

export const updateWorkspaceSchema = z.object({
    name: nameSchema,
    description: descriptionSchema
});

export const changeMemberRoleSchema = z.object({
    roleId: z.string().trim().min(1, "Role ID is required").max(255, "Role ID must be less than 255 characters"),
    memberId: z.string().trim().min(1, "Member ID is required").max(255, "Member ID must be less than 255 characters"),
});
