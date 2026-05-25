import { z } from "zod";

export const uploadAttachmentsRouteParamsSchema = z.object({
    taskId: z.string(),
    workspaceId: z.string(),
});

export const getAttachmentsByTaskRouteParamsSchema = z.object({
    taskId: z.string(),
    workspaceId: z.string(),
});

export const getAttachmentRouteParamsSchema = z.object({
    attachmentId: z.string(),
    workspaceId: z.string(),
});

export const deleteAttachmentRouteParamsSchema = z.object({
    attachmentId: z.string(),
    workspaceId: z.string(),
});
