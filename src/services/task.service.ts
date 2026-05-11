import mongoose from "mongoose";
import TaskModel, { TaskDocument } from "../models/task.model";
import ProjectModel from "../models/project.model";
import { ForbiddenException, NotFoundException } from "../utils/appError";
import { getMemberRoleInWorkspace } from "./workspace.service";
import { RolesEnum } from "../enums/role.enum";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";

const isTaskCreator = (userId: string, task: TaskDocument) => task.createdBy.toString() === userId;

const isTaskAssignee = (userId: string, task: TaskDocument) =>
    task.assignedTo?.toString() === userId;

const isWorkspaceAdminOrOwner = (roleName: string) =>
    roleName === RolesEnum.ADMIN || roleName === RolesEnum.OWNER;

export const getTaskByIdOrThrow = async (taskId: string) => {
    const task = await TaskModel.findById(taskId);
    if (!task) {
        throw new NotFoundException("Task not found");
    }
    return task;
};

export const getProjectByIdOrThrow = async (projectId: string) => {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
        throw new NotFoundException("Project not found");
    }
    return project;
};

export const assertTaskWorkspaceMember = async (userId: string, workspaceId: string) => {
    await getMemberRoleInWorkspace(userId, workspaceId);
};

export const assertTaskReadAccess = async (userId: string, task: TaskDocument) => {
    await assertTaskWorkspaceMember(userId, task.workspace.toString());
};

export const assertTaskUpdateAccess = async (userId: string, task: TaskDocument) => {
    const { role } = await getMemberRoleInWorkspace(userId, task.workspace.toString());
    if (isWorkspaceAdminOrOwner(role) || isTaskCreator(userId, task) || isTaskAssignee(userId, task)) {
        return;
    }
    throw new ForbiddenException("Only the task creator, assignee, or workspace admin can update this task");
};

export const assertTaskDeleteAccess = async (userId: string, task: TaskDocument) => {
    const { role } = await getMemberRoleInWorkspace(userId, task.workspace.toString());
    if (isWorkspaceAdminOrOwner(role) || isTaskCreator(userId, task)) {
        return;
    }
    throw new ForbiddenException("Only the task creator or workspace admin can delete this task");
};

export const createTaskService = async (
    userId: string,
    projectId: string,
    body: {
        title: string;
        description?: string | undefined;
        status?: typeof TaskStatusEnum.BACKLOG | typeof TaskStatusEnum.TODO | typeof TaskStatusEnum.IN_PROGRESS | typeof TaskStatusEnum.DONE | undefined;
        priority?: typeof TaskPriorityEnum.LOW | typeof TaskPriorityEnum.MEDIUM | typeof TaskPriorityEnum.HIGH | undefined;
        dueDate?: Date | undefined;
        assigneeId?: string | undefined;
    }
) => {
    const project = await getProjectByIdOrThrow(projectId);
    const workspaceId = project.workspace.toString();
    await assertTaskWorkspaceMember(userId, workspaceId);

    const task = await TaskModel.create({
        title: body.title,
        description: body.description ?? "",
        project: projectId,
        workspace: workspaceId,
        status: body.status ?? TaskStatusEnum.BACKLOG,
        priority: body.priority ?? TaskPriorityEnum.MEDIUM,
        assignedTo: body.assigneeId ?? undefined,
        createdBy: userId,
        dueDate: body.dueDate,
    });

    const populatedTask = await TaskModel.findById(task._id)
        .populate("createdBy", "name email avatar")
        .populate("assignedTo", "name email avatar");

    return { task: populatedTask ?? task };
};

export const updateTaskService = async (
    userId: string,
    taskId: string,
    body: {
        title?: string | undefined;
        description?: string | undefined;
        status?: typeof TaskStatusEnum.BACKLOG | typeof TaskStatusEnum.TODO | typeof TaskStatusEnum.IN_PROGRESS | typeof TaskStatusEnum.DONE | undefined;
        priority?: typeof TaskPriorityEnum.LOW | typeof TaskPriorityEnum.MEDIUM | typeof TaskPriorityEnum.HIGH | undefined;
        dueDate?: Date | null | undefined;
        assigneeId?: string | null | undefined;
    }
) => {
    const task = await getTaskByIdOrThrow(taskId);
    await assertTaskUpdateAccess(userId, task);

    if (body.title !== undefined) {
        task.title = body.title;
    }
    if (body.description !== undefined) {
        task.description = body.description ?? "";
    }
    if (body.status !== undefined) {
        task.status = body.status;
    }
    if (body.priority !== undefined) {
        task.priority = body.priority;
    }
    if (body.dueDate !== undefined) {
        task.dueDate = (body.dueDate ?? undefined) as any;
    }
    if (body.assigneeId !== undefined) {
        task.assignedTo = body.assigneeId ? new mongoose.Types.ObjectId(body.assigneeId) : (undefined as any);
    }

    await task.save();

    const updatedTask = await TaskModel.findById(task._id)
        .populate("createdBy", "name email avatar")
        .populate("assignedTo", "name email avatar");

    return { task: updatedTask ?? task };
};

export const listTasksByProjectService = async (
    userId: string,
    projectId: string,
    query: {
        page: number;
        limit: number;
        status?: typeof TaskStatusEnum.BACKLOG | typeof TaskStatusEnum.TODO | typeof TaskStatusEnum.IN_PROGRESS | typeof TaskStatusEnum.DONE | undefined;
        priority?: typeof TaskPriorityEnum.LOW | typeof TaskPriorityEnum.MEDIUM | typeof TaskPriorityEnum.HIGH | undefined;
        assigneeId?: string | undefined;
    }
) => {
    const project = await getProjectByIdOrThrow(projectId);
    const workspaceId = project.workspace.toString();
    await assertTaskWorkspaceMember(userId, workspaceId);

    const filter: mongoose.FilterQuery<TaskDocument> = { project: projectId };
    if (query.status) {
        filter.status = query.status;
    }
    if (query.priority) {
        filter.priority = query.priority;
    }
    if (query.assigneeId) {
        filter.assignedTo = query.assigneeId;
    }

    const skip = (query.page - 1) * query.limit;
    const [tasks, total] = await Promise.all([
        TaskModel.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(query.limit)
            .populate("createdBy", "name email avatar")
            .populate("assignedTo", "name email avatar")
            .lean(),
        TaskModel.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
        tasks,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages,
        },
    };
};

export const getTaskByIdService = async (userId: string, taskId: string) => {
    const task = await TaskModel.findById(taskId)
        .populate("createdBy", "name email avatar")
        .populate("assignedTo", "name email avatar");

    if (!task) {
        throw new NotFoundException("Task not found");
    }

    await assertTaskReadAccess(userId, task);
    return { task };
};

export const getTaskEnumsService = async () => {
    return {
        status: TaskStatusEnum,
        priority: TaskPriorityEnum,
    };
};

export const deleteTaskService = async (userId: string, taskId: string) => {
    const task = await getTaskByIdOrThrow(taskId);
    await assertTaskDeleteAccess(userId, task);

    await TaskModel.findByIdAndDelete(taskId);
    return { message: "Task deleted successfully" };
};
