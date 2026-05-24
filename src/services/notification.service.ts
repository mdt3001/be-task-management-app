import NotificationModel from "../models/notification.model";
import { NotificationTypeEnum } from "../enums/notification.enum";
import { emitToUser, SOCKET_EVENTS } from "../config/socket.config";
import { NotFoundException } from "../utils/appError";

export type TaskAssignedNotificationPayload = {
    _id: string;
    type: typeof NotificationTypeEnum.TASK_ASSIGNED;
    taskId: string;
    taskCode: string;
    title: string;
    workspaceId: string;
    projectId: string;
    isRead: boolean;
    createdAt: string;
};

function mapNotificationForFe(doc: {
    _id: unknown;
    type: string;
    title: string;
    content: string;
    data: Record<string, unknown> | null;
    isRead: boolean;
    workspaceId: unknown;
    createdAt: Date;
}) {
    const data = doc.data ?? {};
    return {
        _id: String(doc._id),
        type: doc.type,
        title: doc.title,
        content: doc.content,
        taskId: String(data.taskId ?? ""),
        taskCode: String(data.taskCode ?? ""),
        taskTitle: String(data.taskTitle ?? doc.title),
        workspaceId: String(doc.workspaceId),
        projectId: String(data.projectId ?? ""),
        isRead: doc.isRead,
        createdAt: doc.createdAt.toISOString(),
    };
}

export const notifyTaskAssignedService = async (params: {
    assigneeId: string;
    actorId: string;
    workspaceId: string;
    projectId: string;
    taskId: string;
    taskCode: string;
    title: string;
}) => {
    const { assigneeId, actorId, workspaceId, projectId, taskId, taskCode, title } = params;

    if (assigneeId === actorId) {
        return null;
    }

    const notification = await NotificationModel.create({
        userId: assigneeId,
        workspaceId,
        type: NotificationTypeEnum.TASK_ASSIGNED,
        title: "Task assigned to you",
        content: `${taskCode}: ${title}`,
        data: { taskId, taskCode, taskTitle: title, projectId },
        isRead: false,
        readAt: null,
    });

    const payload: TaskAssignedNotificationPayload = {
        _id: String(notification._id),
        type: NotificationTypeEnum.TASK_ASSIGNED,
        taskId,
        taskCode,
        title,
        workspaceId,
        projectId,
        isRead: false,
        createdAt: notification.createdAt.toISOString(),
    };

    emitToUser(assigneeId, SOCKET_EVENTS.TASK_ASSIGNED, payload);

    return payload;
};

export const listNotificationsService = async (userId: string, workspaceId: string) => {
    const notifications = await NotificationModel.find({ userId, workspaceId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    return {
        notifications: notifications.map(mapNotificationForFe),
        unreadCount: notifications.filter((n) => !n.isRead).length,
    };
};

export const markNotificationReadService = async (
    userId: string,
    workspaceId: string,
    notificationId: string
) => {
    const notification = await NotificationModel.findOneAndUpdate(
        { _id: notificationId, userId, workspaceId },
        { isRead: true, readAt: new Date() },
        { new: true }
    ).lean();

    if (!notification) {
        throw new NotFoundException("Notification not found");
    }

    return { notification: mapNotificationForFe(notification) };
};

export const markAllNotificationsReadService = async (userId: string, workspaceId: string) => {
    await NotificationModel.updateMany(
        { userId, workspaceId, isRead: false },
        { isRead: true, readAt: new Date() }
    );

    return { message: "All notifications marked as read" };
};
