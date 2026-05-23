import { Router } from "express";
import { uploadMiddleware } from "../middlewares/upload.middleware";
import {
    uploadAttachmentsController,
    getAttachmentsByTaskController,
    getAttachmentController,
    deleteAttachmentController,
} from "../controllers/attachment.controller";

export const attachmentRoutes = Router();

// Upload multiple attachments
attachmentRoutes.post(
    "/attachment/task/:taskId/workspace/:workspaceId/upload",
    uploadMiddleware.array("files", 5),
    uploadAttachmentsController
);

// Get all attachments for a task
attachmentRoutes.get(
    "/attachment/task/:taskId/workspace/:workspaceId",
    getAttachmentsByTaskController
);

// Get single attachment
attachmentRoutes.get(
    "/attachment/:attachmentId/workspace/:workspaceId",
    getAttachmentController
);

// Soft delete attachment
attachmentRoutes.delete(
    "/attachment/:attachmentId/workspace/:workspaceId/delete",
    deleteAttachmentController
);
