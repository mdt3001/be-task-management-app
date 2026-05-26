import { Router } from "express";
import {
    listNotificationsController,
    markAllNotificationsReadController,
    markNotificationReadController,
} from "../controllers/notification.controller";

export const notificationRoutes = Router();

notificationRoutes.get("/:workspaceId/notifications", listNotificationsController);
notificationRoutes.put("/:workspaceId/notifications/read-all", markAllNotificationsReadController);
notificationRoutes.put(
    "/:workspaceId/notifications/:notificationId/read",
    markNotificationReadController
);
