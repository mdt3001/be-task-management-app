import { z } from "zod";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";
import { descriptionSchema } from "./workspace.validation";

export const taskIdParamSchema = z.string().trim().min(1, "Task ID is required").max(255);
export const projectIdParamSchema = z.string().trim().min(1, "Project ID is required").max(255);

export const createTaskSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(255),
    description: descriptionSchema,
    status: z.enum([
        TaskStatusEnum.BACKLOG,
        TaskStatusEnum.TODO,
        TaskStatusEnum.IN_PROGRESS,
        TaskStatusEnum.DONE,
    ]).optional(),
    priority: z.enum([TaskPriorityEnum.LOW, TaskPriorityEnum.MEDIUM, TaskPriorityEnum.HIGH]).optional(),
    dueDate: z.coerce.date().optional(),
    assigneeId: z.string().trim().min(1).max(255).optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(255).optional(),
    description: descriptionSchema,
    status: z.enum([
        TaskStatusEnum.BACKLOG,
        TaskStatusEnum.TODO,
        TaskStatusEnum.IN_PROGRESS,
        TaskStatusEnum.DONE,
    ]).optional(),
    priority: z.enum([TaskPriorityEnum.LOW, TaskPriorityEnum.MEDIUM, TaskPriorityEnum.HIGH]).optional(),
    dueDate: z.coerce.date().nullable().optional(),
    assigneeId: z.string().trim().min(1).max(255).nullable().optional(),
});

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const listTasksQuerySchema = paginationSchema.extend({
    status: z.enum([
        TaskStatusEnum.BACKLOG,
        TaskStatusEnum.TODO,
        TaskStatusEnum.IN_PROGRESS,
        TaskStatusEnum.DONE,
    ]).optional(),
    priority: z.enum([TaskPriorityEnum.LOW, TaskPriorityEnum.MEDIUM, TaskPriorityEnum.HIGH]).optional(),
    assigneeId: z.string().trim().min(1).max(255).optional(),
});
