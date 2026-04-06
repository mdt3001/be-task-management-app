import mongoose, { Schema } from "mongoose";
import { TaskPriorityEnum, TaskPriorityEnumType, TaskStatusEnumType, TaskStatusEnum } from "../enums/task.enum";
import { generateTaskCode } from "../utils/uuid";

export interface Task {
    taskCode: string;
    title: string;
    description: string;
    project: mongoose.Types.ObjectId;
    workspace: mongoose.Types.ObjectId;
    status?: TaskStatusEnumType;
    priority?: TaskPriorityEnumType;
    assignedTo?: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
};

export interface TaskDocument extends mongoose.Document, Task { };

const taskSchema = new mongoose.Schema<TaskDocument>(
    {
        taskCode: { type: String, required: true, unique: true, index: true, default: generateTaskCode },
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
        workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        status: { type: String, enum: Object.values(TaskStatusEnum), default: TaskStatusEnum.BACKLOG },
        priority: { type: String, enum: Object.values(TaskPriorityEnum), default: TaskPriorityEnum.MEDIUM },
        assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        dueDate: { type: Date },
    },
    {
        timestamps: true,
    }
);

const TaskModel = mongoose.model<TaskDocument>("Task", taskSchema);
export default TaskModel;
