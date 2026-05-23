import mongoose from "mongoose";
import TaskModel, { TaskDocument, TaskLabel, TaskSubtask } from "../models/task.model";
import ProjectModel from "../models/project.model";
import TaskActivityModel from "../models/task-activity.model";
import { TaskActivityActionEnum } from "../enums/task-activity.enum";
import { BadRequestException, ForbiddenException, NotFoundException } from "../utils/appError";
import { getMemberRoleInWorkspace } from "./workspace.service";
import { RolesEnum } from "../enums/role.enum";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";
import { normalizeDescription, TiptapDocument } from "../utils/tiptap-doc.util";
import { deleteAttachmentsForTaskService } from "./attachment.service";

const isTaskCreator = (userId: string, task: TaskDocument) => task.createdBy.toString() === userId;

const isTaskAssignee = (userId: string, task: TaskDocument) =>
    task.assignedTo?.toString() === userId;

const isWorkspaceAdminOrOwner = (roleName: string) =>
    roleName === RolesEnum.ADMIN || roleName === RolesEnum.OWNER;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type UserPopulated = { _id?: unknown; name?: string; avatar?: string | null; email?: string };

function mapUserForFe(user: UserPopulated | null | undefined) {
    if (!user || typeof user !== "object") {
        return null;
    }
    return {
        _id: String(user._id),
        name: user.name ?? "Unknown",
        profilePicture: user.avatar ?? null,
    };
}

function mapTaskForFe<T extends Record<string, unknown>>(task: T) {
    const assigned = task.assignedTo as UserPopulated | null | undefined;
    const createdBy = task.createdBy as UserPopulated | null | undefined;
    const parentTask = task.parentTask as { _id?: unknown; taskCode?: string; title?: string } | null | undefined;

    return {
        ...task,
        description: normalizeDescription(task.description),
        assignedTo: mapUserForFe(assigned),
        reporter: mapUserForFe(createdBy),
        parentTask:
            parentTask && typeof parentTask === "object" && parentTask._id
                ? {
                      _id: String(parentTask._id),
                      taskCode: parentTask.taskCode ?? "",
                      title: parentTask.title ?? "",
                  }
                : null,
    };
}

const populateTaskQuery = (query: mongoose.Query<unknown, unknown>) =>
    query
        .populate("createdBy", "name email avatar")
        .populate("assignedTo", "name email avatar")
        .populate("project", "_id emoji name")
        .populate("parentTask", "_id taskCode title");

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

type UpdateTaskBody = {
    title?: string | undefined;
    description?: string | TiptapDocument | undefined;
    status?: typeof TaskStatusEnum[keyof typeof TaskStatusEnum] | undefined;
    priority?: typeof TaskPriorityEnum[keyof typeof TaskPriorityEnum] | undefined;
    dueDate?: Date | null | undefined;
    startDate?: Date | null | undefined;
    assignedTo?: string | null | undefined;
    parentTask?: string | null | undefined;
    labels?: TaskLabel[] | undefined;
    subtasks?: { _id?: string; title: string; completed: boolean }[] | undefined;
};

export type TaskUpdateAccess = "full" | "status_only";

const isStatusOnlyUpdateBody = (body: UpdateTaskBody) => {
    const fields = (Object.keys(body) as (keyof UpdateTaskBody)[]).filter((key) => body[key] !== undefined);
    return fields.length > 0 && fields.every((key) => key === "status");
};

export const resolveTaskUpdateAccess = async (
    userId: string,
    task: TaskDocument,
    body: UpdateTaskBody
): Promise<TaskUpdateAccess> => {
    const { role } = await getMemberRoleInWorkspace(userId, task.workspace.toString());

    if (isWorkspaceAdminOrOwner(role) || isTaskCreator(userId, task)) {
        return "full";
    }

    if (isTaskAssignee(userId, task)) {
        if (isStatusOnlyUpdateBody(body)) {
            return "status_only";
        }
        throw new ForbiddenException("Assignees can only update the task status");
    }

    throw new ForbiddenException("You do not have permission to update this task");
};

const logTaskActivity = async (
    task: TaskDocument,
    actorId: string,
    changes: { field: string; from: unknown; to: unknown }[]
) => {
    if (changes.length === 0) {
        return;
    }
    await TaskActivityModel.create({
        taskId: task._id,
        workspaceId: task.workspace,
        actorId,
        action: TaskActivityActionEnum.UPDATED,
        changes,
        metadata: null,
    });
};

export const getTaskByIdService = async (userId: string, taskId: string, workspaceId: string) => {
    const task = await populateTaskQuery(TaskModel.findById(taskId)).lean();

    if (!task) {
        throw new NotFoundException("Task not found");
    }

    const doc = task as unknown as TaskDocument & Record<string, unknown>;
    if (doc.workspace.toString() !== workspaceId) {
        throw new BadRequestException("Task does not belong to this workspace");
    }

    await assertTaskWorkspaceMember(userId, workspaceId);

    return { task: mapTaskForFe(doc as Record<string, unknown>) };
};

type CreateTaskBody = {
    title: string;
    description?: string | TiptapDocument | undefined;
    status: typeof TaskStatusEnum[keyof typeof TaskStatusEnum];
    priority: typeof TaskPriorityEnum[keyof typeof TaskPriorityEnum];
    dueDate: Date;
    assignedTo: string;
};

export const createTaskService = async (
    userId: string,
    workspaceId: string,
    projectId: string,
    body: CreateTaskBody
) => {
    await assertProjectBelongsToWorkspace(projectId, workspaceId);
    await assertTaskWorkspaceMember(userId, workspaceId);

    const task = await TaskModel.create({
        title: body.title,
        description: normalizeDescription(body.description),
        project: projectId,
        workspace: workspaceId,
        status: body.status ?? TaskStatusEnum.BACKLOG,
        priority: body.priority ?? TaskPriorityEnum.MEDIUM,
        assignedTo: body.assignedTo,
        createdBy: userId,
        dueDate: body.dueDate,
    });

    const populatedTask = await populateTaskQuery(TaskModel.findById(task._id)).lean();
    return { task: mapTaskForFe((populatedTask ?? task.toObject()) as Record<string, unknown>) };
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

    const access = await resolveTaskUpdateAccess(userId, task, body);
    const patch = access === "status_only" ? { status: body.status } : body;

    const changes: { field: string; from: unknown; to: unknown }[] = [];

    if (patch.title !== undefined && patch.title !== task.title) {
        changes.push({ field: "title", from: task.title, to: patch.title });
        task.title = patch.title;
    }
    if (patch.description !== undefined) {
        const next = normalizeDescription(patch.description);
        changes.push({ field: "description", from: task.description, to: next });
        task.description = next;
    }
    if (patch.status !== undefined && patch.status !== task.status) {
        changes.push({ field: "status", from: task.status, to: patch.status });
        task.status = patch.status;
    }
    if (patch.priority !== undefined && patch.priority !== task.priority) {
        changes.push({ field: "priority", from: task.priority, to: patch.priority });
        task.priority = patch.priority;
    }

    if (patch.assignedTo !== undefined) {
        changes.push({ field: "assignedTo", from: task.assignedTo?.toString() ?? null, to: patch.assignedTo });
        task.assignedTo = patch.assignedTo
            ? new mongoose.Types.ObjectId(patch.assignedTo)
            : (undefined as unknown as mongoose.Types.ObjectId);
    }
    if (patch.parentTask !== undefined) {
        changes.push({ field: "parentTask", from: task.parentTask?.toString() ?? null, to: patch.parentTask });
        task.parentTask = patch.parentTask
            ? new mongoose.Types.ObjectId(patch.parentTask)
            : null;
    }
    if (patch.labels !== undefined) {
        changes.push({ field: "labels", from: task.labels, to: patch.labels });
        task.labels = patch.labels;
    }
    if (patch.dueDate !== undefined) {
        changes.push({ field: "dueDate", from: task.dueDate, to: patch.dueDate });
        task.dueDate = patch.dueDate;
    }
    if (patch.startDate !== undefined) {
        changes.push({ field: "startDate", from: task.startDate, to: patch.startDate });
        task.startDate = patch.startDate;
    }
    if (patch.subtasks !== undefined) {
        const subtasks: TaskSubtask[] = patch.subtasks.map((st) => ({
            _id: st._id ? new mongoose.Types.ObjectId(st._id) : new mongoose.Types.ObjectId(),
            title: st.title,
            completed: st.completed,
        }));
        changes.push({ field: "subtasks", from: task.subtasks, to: subtasks });
        task.subtasks = subtasks;
    }

    await task.save();
    await logTaskActivity(task, userId, changes);

    const updatedTask = await populateTaskQuery(TaskModel.findById(task._id)).lean();
    return { task: mapTaskForFe((updatedTask ?? task.toObject()) as Record<string, unknown>) };
};

export const getTaskActivitiesService = async (userId: string, taskId: string, workspaceId: string) => {
    const task = await getTaskByIdOrThrow(taskId);
    if (task.workspace.toString() !== workspaceId) {
        throw new BadRequestException("Task does not belong to this workspace");
    }
    await assertTaskWorkspaceMember(userId, workspaceId);

    const activities = await TaskActivityModel.find({ taskId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("actorId", "name avatar")
        .lean();

    return {
        activities: activities.map((a) => ({
            ...a,
            actor: mapUserForFe(a.actorId as UserPopulated),
        })),
    };
};

type ListWorkspaceTasksQuery = {
    pageNumber: number;
    pageSize: number;
    keyword?: string | undefined;
    projectId?: string | undefined;
    assignedTo?: string | undefined;
    status?: typeof TaskStatusEnum[keyof typeof TaskStatusEnum] | undefined;
    priority?: typeof TaskPriorityEnum[keyof typeof TaskPriorityEnum] | undefined;
    dueDate?: string | undefined;
};

export const listAllTasksInWorkspaceService = async (userId: string, workspaceId: string, query: ListWorkspaceTasksQuery) => {
    await assertTaskWorkspaceMember(userId, workspaceId);

    const filter: mongoose.FilterQuery<TaskDocument> = { workspace: workspaceId };
    if (query.projectId) {
        filter.project = query.projectId;
    }
    if (query.status) {
        filter.status = query.status;
    }
    if (query.priority) {
        filter.priority = query.priority;
    }
    if (query.assignedTo) {
        filter.assignedTo = query.assignedTo;
    }
    if (query.keyword?.trim()) {
        const kw = escapeRegex(query.keyword.trim());
        filter.$or = [
            { title: { $regex: kw, $options: "i" } },
            { taskCode: { $regex: kw, $options: "i" } },
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
        populateTaskQuery(TaskModel.find(filter))
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        TaskModel.countDocuments(filter),
    ]);

    const tasks = (tasksRaw as unknown as Record<string, unknown>[]).map((t) => mapTaskForFe(t));
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
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    if (!isWorkspaceAdminOrOwner(role) && !isTaskCreator(userId, task)) {
        throw new ForbiddenException("Only the task creator or workspace admin can delete this task");
    }

    // Delete all attachments from Cloudinary and soft delete them
    await deleteAttachmentsForTaskService(taskId);

    await TaskModel.findByIdAndDelete(taskId);
    return { message: "Task deleted successfully" };
};
