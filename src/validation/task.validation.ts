import { z } from "zod";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";
import { descriptionSchema } from "./workspace.validation";

export const taskIdParamSchema = z.string().trim().min(1, "Task ID is required").max(255);
export const projectIdParamSchema = z.string().trim().min(1, "Project ID is required").max(255);
export const workspaceIdParamSchema = z.string().trim().min(1, "Workspace ID is required").max(255);

const taskStatusZodEnum = z.enum([
    TaskStatusEnum.BACKLOG,
    TaskStatusEnum.TODO,
    TaskStatusEnum.IN_PROGRESS,
    TaskStatusEnum.IN_REVIEW,
    TaskStatusEnum.DONE,
]);

const taskPriorityZodEnum = z.enum([TaskPriorityEnum.LOW, TaskPriorityEnum.MEDIUM, TaskPriorityEnum.HIGH]);

export const createTaskSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(255),
    description: descriptionSchema,
    status: taskStatusZodEnum,
    priority: taskPriorityZodEnum,
    dueDate: z.coerce.date().catch(new Date()),
    assignedTo: z.string().trim().min(1, "assignedTo is required").max(255),
    taskCode: z.string().trim().min(1, "Task code is required").max(255),
});

export const updateTaskSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(255).optional(),
    description: descriptionSchema.optional(),
    status: taskStatusZodEnum.optional(),
    priority: taskPriorityZodEnum.optional(),
    dueDate: z.coerce.date().optional(),
    assignedTo: z.string().trim().min(1).max(255).nullable().optional(),
});

export const allTasksInWorkspaceQuerySchema = z.object({
    keyword: z.string().trim().min(1).max(512).optional(),
    projectId: z.string().trim().min(1).max(512).optional(),
    assignedTo: z.string().trim().min(1).max(512).optional(),

    status: z.string().optional().refine((val) => {
        if (!val) return true;
        return val.split(",").every((item) => taskStatusZodEnum.options.includes(item.trim() as any));
    }, {
        message: `Invalid option: expected one or more of ${taskStatusZodEnum.options.join("|")}`
    }),

    priority: z.string().optional().refine((val) => {
        if (!val) return true;
        return val.split(",").every((item) => taskPriorityZodEnum.options.includes(item.trim() as any));
    }, {
        message: `Invalid option: expected one or more of ${taskPriorityZodEnum.options.join("|")}`
    }),

    dueDate: z.string().trim().min(1).max(64).optional(),
    pageNumber: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const createTaskRouteParamsSchema = z.object({
    projectId: projectIdParamSchema,
    workspaceId: workspaceIdParamSchema,
});

export const updateTaskRouteParamsSchema = z.object({
    taskId: taskIdParamSchema,
    projectId: projectIdParamSchema,
    workspaceId: workspaceIdParamSchema,
});

export const deleteTaskRouteParamsSchema = z.object({
    taskId: taskIdParamSchema,
    workspaceId: workspaceIdParamSchema,
});

export const workspaceTasksRouteParamsSchema = z.object({
    workspaceId: workspaceIdParamSchema,
});
