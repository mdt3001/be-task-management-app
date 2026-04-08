import mongoose, { Document, Schema } from "mongoose";
import { NotificationTypeEnum, NotificationTypeEnumType } from "../enums/notification.enum";

export interface Notification {
    userId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    type: NotificationTypeEnumType;
    title: string;
    content: string;
    data: Record<string, unknown> | null;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface NotificationDocument extends Document, Notification { };

const notificationSchema = new Schema<NotificationDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        type: { type: String, enum: Object.values(NotificationTypeEnum), required: true },
        title: { type: String, required: true, trim: true },
        content: { type: String, required: true, trim: true },
        data: { type: Schema.Types.Mixed, default: null },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const NotificationModel = mongoose.model<NotificationDocument>("Notification", notificationSchema);
export default NotificationModel;
