import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
    uploadAttachmentsService,
    getAttachmentsByTaskIdService,
    softDeleteAttachmentService,
    getAttachmentByIdService,
} from "../services/attachment.service";
import {
    uploadAttachmentsRouteParamsSchema,
    getAttachmentsByTaskRouteParamsSchema,
    getAttachmentRouteParamsSchema,
    deleteAttachmentRouteParamsSchema,
} from "../validation/attachment.validation";

export const uploadAttachmentsController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { taskId, workspaceId } = uploadAttachmentsRouteParamsSchema.parse(req.params);
    const files = req.files as Express.Multer.File[] | undefined;

    const { attachments } = await uploadAttachmentsService(
        String(userId),
        taskId,
        workspaceId,
        files || []
    );

    return res.status(HTTPSTATUS.CREATED).json({
        message: "Attachments uploaded successfully",
        attachments,
    });
});

export const getAttachmentsByTaskController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { taskId, workspaceId } = getAttachmentsByTaskRouteParamsSchema.parse(req.params);

    const { attachments } = await getAttachmentsByTaskIdService(
        String(userId),
        taskId,
        workspaceId
    );

    return res.status(HTTPSTATUS.OK).json({
        message: "Attachments retrieved successfully",
        attachments,
    });
});

export const getAttachmentController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { attachmentId, workspaceId } = getAttachmentRouteParamsSchema.parse(req.params);

    const { attachment } = await getAttachmentByIdService(
        String(userId),
        attachmentId,
        workspaceId
    );

    return res.status(HTTPSTATUS.OK).json({
        message: "Attachment retrieved successfully",
        attachment,
    });
});

export const deleteAttachmentController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { attachmentId, workspaceId } = deleteAttachmentRouteParamsSchema.parse(req.params);

    const result = await softDeleteAttachmentService(
        String(userId),
        attachmentId,
        workspaceId
    );

    return res.status(HTTPSTATUS.OK).json(result);
});
