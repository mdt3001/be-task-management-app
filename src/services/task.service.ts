import mongoose from "mongoose";
import TaskModel, { TaskDocument } from "../models/task.model";
import ProjectModel from "../models/project.model";
import { BadRequestException, ForbiddenException, NotFoundException } from "../utils/appError";
import { getMemberRoleInWorkspace } from "./workspace.service";
import { RolesEnum } from "../enums/role.enum";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";

const isTaskCreator = (userId: string, task: TaskDocument) => task.createdBy.toString() === userId;

const isTaskAssignee = (userId: string, task: TaskDocument) =>
    task.assignedTo?.toString() === userId;

const isWorkspaceAdminOrOwner = (roleName: string) =>
    roleName === RolesEnum.ADMIN || roleName === RolesEnum.OWNER;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function mapTaskForFe<T extends { assignedTo?: unknown }>(task: T): T {
    const assigned = task.assignedTo as { _id?: unknown; name?: string; avatar?: string | null } | null | undefined;
    if (!assigned || typeof assigned !== "object") {
        return task;
    }
    const { avatar, ...rest } = assigned as { _id?: unknown; name?: string; avatar?: string | null;[k: string]: unknown };
    return {
        ...task,
        assignedTo: {
            ...rest,
            profilePicture: avatar ?? null,
        },
    } as T;
}

function normalizeDoc<T extends { assignedTo?: unknown }>(task: T | null | undefined): T | null | undefined {
    if (!task) return task;
    return mapTaskForFe(task);
}

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

export const assertProjectBelongsToWorkspace = async (projectId: string, workspaceId: string) => {
    const project = await getProjectByIdOrThrow(projectId);
    if (project.workspace.toString() !== workspaceId) {
        throw new BadRequestException("Project does not belong to this workspace");
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

type CreateTaskBody = {
    title: string;
    description?: string | undefined;
    status: typeof TaskStatusEnum[keyof typeof TaskStatusEnum];
    priority: typeof TaskPriorityEnum[keyof typeof TaskPriorityEnum];
    dueDate: Date;
    assignedTo: string;
    taskCode?: string | undefined;
};

export const createTaskService = async (
    userId: string,
    workspaceId: string,
    projectId: string,
    body: CreateTaskBody
) => {
    // 1. Kiểm tra quyền và project thuộc workspace
    const project = await assertProjectBelongsToWorkspace(projectId, workspaceId);
    await assertTaskWorkspaceMember(userId, workspaceId);

    // 2. ĐẾM TỔNG SỐ TASK ĐANG CÓ TRONG PROJECT NÀY
    const totalTasks = await TaskModel.countDocuments({
        project: projectId,
        workspace: workspaceId
    });

    // 3. TẠO TASK CODE THEO CÔNG THỨC: Số lượng hiện tại + 1
    const projectKey = (project as any).key || "TASK";
    const nextTaskNumber = totalTasks + 1;
    const generatedTaskCode = `${projectKey}-${nextTaskNumber}`;

    // 4. Khởi tạo Task vào DB
    const task = await TaskModel.create({
        title: body.title,
        description: body.description ?? "",
        project: projectId,
        workspace: workspaceId,
        status: body.status ?? TaskStatusEnum.BACKLOG,
        priority: body.priority ?? TaskPriorityEnum.MEDIUM,
        assignedTo: body.assignedTo,
        createdBy: userId,
        dueDate: body.dueDate,
        taskCode: generatedTaskCode,
    });

    // 5. Trả về dữ liệu cho FE
    const populatedTask = await TaskModel.findById(task._id)
        .populate("createdBy", "name email avatar")
        .populate("assignedTo", "name email avatar")
        .populate("project", "_id emoji name");

    const shaped = normalizeDoc(populatedTask ?? task);
    return { task: shaped! };
};

type UpdateTaskBody = {
    title?: string | undefined;
    description?: string | undefined;
    status?: typeof TaskStatusEnum[keyof typeof TaskStatusEnum] | undefined;
    priority?: typeof TaskPriorityEnum[keyof typeof TaskPriorityEnum] | undefined;
    dueDate?: Date | undefined;
    assignedTo?: string | null | undefined;
};

export const updateTaskService = async (
    userId: string,
    workspaceId: string,
    projectId: string,
    taskId: string,
    body: UpdateTaskBody
) => {
    const task = await getTaskByIdOrThrow(taskId);
    if (task.workspace.toString() !== workspaceId) {
        throw new BadRequestException("Task does not belong to this workspace");
    }
    if (task.project.toString() !== projectId) {
        throw new BadRequestException("Task does not belong to this project");
    }

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
        task.dueDate = body.dueDate ?? undefined as any;
    }
    if (body.assignedTo !== undefined) {
        task.assignedTo = body.assignedTo ? new mongoose.Types.ObjectId(body.assignedTo) : (undefined as any);
    }

    await task.save();

    const updatedTask = await TaskModel.findById(task._id)
        .populate("createdBy", "name email avatar")
        .populate("assignedTo", "name email avatar")
        .populate("project", "_id emoji name");

    const shaped = normalizeDoc(updatedTask ?? task);
    return { task: shaped! };
};

type ListWorkspaceTasksQuery = {
    pageNumber: number;
    pageSize: number;
    keyword?: string | undefined;
    projectId?: string | undefined;
    assignedTo?: string | undefined;
    status?: string | undefined;   // Đổi thành string để nhận chuỗi "TODO,IN_PROGRESS"
    priority?: string | undefined; // Đổi thành string
    dueDate?: string | undefined;
};

export const listAllTasksInWorkspaceService = async (userId: string, workspaceId: string, query: ListWorkspaceTasksQuery) => {
    await assertTaskWorkspaceMember(userId, workspaceId);

    const filter: mongoose.FilterQuery<TaskDocument> = { workspace: workspaceId };

    // Hàm cắt chuỗi tiện ích
    const parseFilter = (value: string | string[] | undefined) => {
        if (!value) return undefined;
        if (Array.isArray(value)) return value;
        return value.split(',').map(v => v.trim()).filter(Boolean);
    };

    // Áp dụng lọc nhiều điều kiện
    if (query.projectId) {
        filter.project = { $in: parseFilter(query.projectId) };
    }
    if (query.status) {
        filter.status = { $in: parseFilter(query.status) };
    }
    if (query.priority) {
        filter.priority = { $in: parseFilter(query.priority) };
    }
    if (query.assignedTo) {
        filter.assignedTo = { $in: parseFilter(query.assignedTo) };
    }
    if (query.dueDate) {
        const d = new Date(query.dueDate);
        if (!Number.isNaN(d.getTime())) {
            const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
            const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
            filter.dueDate = { $gte: start, $lte: end };
        }
    }

    // Tìm kiếm theo từ khóa
    if (query.keyword?.trim()) {
        const kw = escapeRegex(query.keyword.trim());
        filter.$or = [
            { title: { $regex: kw, $options: "i" } },
            { description: { $regex: kw, $options: "i" } },
        ];
    }

    if (query.dueDate) {
        const d = new Date(query.dueDate);
        if (!Number.isNaN(d.getTime())) {
            const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
            const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
            filter.dueDate = { $gte: start, $lte: end };
        }
    }


    // Tìm kiếm theo từ khóa
    if (query.keyword?.trim()) {
        const kw = escapeRegex(query.keyword.trim());
        filter.$or = [
            { title: { $regex: kw, $options: "i" } },
            { description: { $regex: kw, $options: "i" } },
        ];
    }

    if (query.dueDate) {
        const d = new Date(query.dueDate);
        if (!Number.isNaN(d.getTime())) {
            const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
            const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
            filter.dueDate = { $gte: start, $lte: end };
        }
    }

    const skip = (query.pageNumber - 1) * query.pageSize;
    const limit = query.pageSize;

    const [tasksRaw, total] = await Promise.all([
        TaskModel.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("createdBy", "name email avatar")
            .populate("assignedTo", "name email avatar")
            .populate("project", "_id emoji name")
            .lean(),
        TaskModel.countDocuments(filter),
    ]);

    const tasks = tasksRaw.map((t) => mapTaskForFe(t));
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
        tasks,
        pagination: {
            totalCount: total,
            pageSize: limit,
            pageNumber: query.pageNumber,
            totalPages,
            skip,
            limit,
        },
    };
};

export const deleteTaskService = async (userId: string, taskId: string, workspaceId: string) => {
    const task = await getTaskByIdOrThrow(taskId);
    if (task.workspace.toString() !== workspaceId) {
        throw new BadRequestException("Task does not belong to this workspace");
    }
    await assertTaskDeleteAccess(userId, task);

    await TaskModel.findByIdAndDelete(taskId);
    return { message: "Task deleted successfully" };
};
