import mongoose, { Schema } from "mongoose";
import { TaskPriorityEnum, TaskPriorityEnumType, TaskStatusEnumType, TaskStatusEnum } from "../enums/task.enum";
import { generateTaskCode } from "../utils/uuid";
import { EMPTY_TIPTAP_DOC } from "../utils/tiptap-doc.util";

export interface TaskSubtask {
    _id: mongoose.Types.ObjectId;
    title: string;
    completed: boolean;
}

export interface TaskLabel {
    name: string;
    color: string;
}

export interface Task {
    taskCode: string;
    title: string;
    description: unknown;
    project: mongoose.Types.ObjectId;
    workspace: mongoose.Types.ObjectId;
    status?: TaskStatusEnumType;
    priority?: TaskPriorityEnumType;
    assignedTo?: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    parentTask?: mongoose.Types.ObjectId | null;
    labels: TaskLabel[];
    subtasks: TaskSubtask[];
    dueDate?: Date | null;
    startDate?: Date | null;
    attachmentCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskDocument extends mongoose.Document, Task { }

const subtaskSchema = new Schema<TaskSubtask>(
    {
        title: { type: String, required: true, trim: true },
        completed: { type: Boolean, default: false },
    },
    { _id: true }
);

const labelSchema = new Schema<TaskLabel>(
    {
        name: { type: String, required: true, trim: true },
        color: { type: String, required: true, default: "#6366F1", trim: true },
    },
    { _id: false }
);

const taskSchema = new mongoose.Schema<TaskDocument>(
    {
        taskCode: { type: String, required: true, unique: true, index: true, default: generateTaskCode },
        title: { type: String, required: true, trim: true },
        description: { type: Schema.Types.Mixed, default: () => EMPTY_TIPTAP_DOC },
        project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
        workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        status: { type: String, enum: Object.values(TaskStatusEnum), default: TaskStatusEnum.BACKLOG },
        priority: { type: String, enum: Object.values(TaskPriorityEnum), default: TaskPriorityEnum.MEDIUM },
        assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        parentTask: { type: Schema.Types.ObjectId, ref: "Task", default: null },
        labels: { type: [labelSchema], default: [] },
        subtasks: { type: [subtaskSchema], default: [] },
        attachmentCount: { type: Number, default: 0 },
        dueDate: { type: Date },
        startDate: { type: Date },
    },
    {
        timestamps: true,
    }
);

const TaskModel = mongoose.model<TaskDocument>("Task", taskSchema);
export default TaskModel;
