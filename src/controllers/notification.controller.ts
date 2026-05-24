import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
    listNotificationsService,
    markAllNotificationsReadService,
    markNotificationReadService,
} from "../services/notification.service";
import { z } from "zod";

const workspaceParamsSchema = z.object({
    workspaceId: z.string().min(1),
});

const notificationParamsSchema = workspaceParamsSchema.extend({
    notificationId: z.string().min(1),
});

export const listNotificationsController = asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId } = workspaceParamsSchema.parse(req.params);
    const userId = String(req.user?._id);

    const result = await listNotificationsService(userId, workspaceId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Notifications retrieved successfully",
        ...result,
    });
});

export const markNotificationReadController = asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId, notificationId } = notificationParamsSchema.parse(req.params);
    const userId = String(req.user?._id);

    const result = await markNotificationReadService(userId, workspaceId, notificationId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Notification marked as read",
        ...result,
    });
});

export const markAllNotificationsReadController = asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId } = workspaceParamsSchema.parse(req.params);
    const userId = String(req.user?._id);

    const result = await markAllNotificationsReadService(userId, workspaceId);

    return res.status(HTTPSTATUS.OK).json(result);
});
