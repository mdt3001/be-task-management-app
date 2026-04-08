import mongoose, { Document, Schema } from "mongoose";

export interface Comment {
    taskId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    content: string;
    parentCommentId: mongoose.Types.ObjectId | null;
    editedAt: Date | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CommentDocument extends Document, Comment { };

const commentSchema = new Schema<CommentDocument>(
    {
        taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true, trim: true },
        parentCommentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
        editedAt: { type: Date, default: null },
        deletedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

commentSchema.index({ taskId: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1, createdAt: 1 });

const CommentModel = mongoose.model<CommentDocument>("Comment", commentSchema);
export default CommentModel;
