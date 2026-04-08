import mongoose, { Document, Schema } from "mongoose";
import { TaskActivityActionEnum, TaskActivityActionEnumType } from "../enums/task-activity.enum";

export interface TaskActivityChange {
    field: string;
    from: unknown;
    to: unknown;
}

export interface TaskActivity {
    taskId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    actorId: mongoose.Types.ObjectId;
    action: TaskActivityActionEnumType;
    changes: TaskActivityChange[];
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskActivityDocument extends Document, TaskActivity { };

const taskActivitySchema = new Schema<TaskActivityDocument>(
    {
        taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        action: { type: String, enum: Object.values(TaskActivityActionEnum), required: true },
        changes: {
            type: [
                {
                    field: { type: String, required: true, trim: true },
                    from: { type: Schema.Types.Mixed, default: null },
                    to: { type: Schema.Types.Mixed, default: null },
                },
            ],
            default: [],
        },
        metadata: { type: Schema.Types.Mixed, default: null },
    },
    {
        timestamps: true,
    }
);

taskActivitySchema.index({ taskId: 1, createdAt: -1 });
taskActivitySchema.index({ workspaceId: 1, createdAt: -1 });

const TaskActivityModel = mongoose.model<TaskActivityDocument>("TaskActivity", taskActivitySchema);
export default TaskActivityModel;
