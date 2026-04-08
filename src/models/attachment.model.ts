import mongoose, { Document, Schema } from "mongoose";

export interface Attachment {
    taskId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    uploaderId: mongoose.Types.ObjectId;
    fileName: string;
    mimeType: string;
    size: number;
    storageKey: string;
    url: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AttachmentDocument extends Document, Attachment { };

const attachmentSchema = new Schema<AttachmentDocument>(
    {
        taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        uploaderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        fileName: { type: String, required: true, trim: true },
        mimeType: { type: String, required: true, trim: true },
        size: { type: Number, required: true, min: 0 },
        storageKey: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
    },
    {
        timestamps: true,
    }
);

attachmentSchema.index({ taskId: 1, createdAt: -1 });

const AttachmentModel = mongoose.model<AttachmentDocument>("Attachment", attachmentSchema);
export default AttachmentModel;
