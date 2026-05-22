import mongoose from "mongoose";
import ProjectModel, { ProjectDocument } from "../models/project.model";
import WorkspaceModel from "../models/workspace.model";
import { ProjectStatusEnum } from "../enums/project.enum";
import { RolesEnum } from "../enums/role.enum";
import { ForbiddenException, NotFoundException } from "../utils/appError";
import { generateUniqueProjectKey } from "../utils/projectKey.util";
import { getMemberRoleInWorkspace } from "./workspace.service";
import TaskModel from "../models/task.model";
import { TaskStatusEnum } from "../enums/task.enum";

const isProjectCreator = (userId: string, project: ProjectDocument) =>
    project.createdBy.toString() === userId;

const isWorkspaceAdminOrOwner = (roleName: string) =>
    roleName === RolesEnum.ADMIN || roleName === RolesEnum.OWNER;

export const assertWorkspaceMember = async (userId: string, workspaceId: string) => {
    await getMemberRoleInWorkspace(userId, workspaceId);
};

export const assertProjectReadAccess = async (userId: string, project: ProjectDocument) => {
    await getMemberRoleInWorkspace(userId, project.workspace.toString());
};

export const assertProjectWriteAccess = async (
    userId: string,
    workspaceId: string,
    project: ProjectDocument
) => {
    if (project.workspace.toString() !== workspaceId) {
        throw new ForbiddenException("Project does not belong to this workspace");
    }
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    if (isWorkspaceAdminOrOwner(role) || isProjectCreator(userId, project)) {
        return;
    }
    throw new ForbiddenException("Only the project owner or a workspace admin can perform this action");
};

export const getProjectByIdOrThrow = async (projectId: string) => {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
        throw new NotFoundException("Project not found");
    }
    return project;
};

export const createProjectService = async (
    userId: string,
    workspaceId: string,
    body: { name: string; description?: string | undefined; emoji?: string | undefined }
) => {
    await assertWorkspaceMember(userId, workspaceId);

    const key = await generateUniqueProjectKey(workspaceId, body.name);

    const project = await ProjectModel.create({
        name: body.name,
        key,
        description: body.description ?? "",
        emoji: body.emoji ?? "📁",
        workspace: workspaceId,
        status: ProjectStatusEnum.ACTIVE,
        createdBy: userId,
    });

    return { project };
};

export const updateProjectService = async (
    userId: string,
    projectId: string,
    body: {
        name?: string | undefined;
        description?: string | undefined;
        status?: typeof ProjectStatusEnum.ACTIVE | typeof ProjectStatusEnum.ARCHIVED | undefined;
        startDate?: Date | null | undefined;
        endDate?: Date | null | undefined;
    }
) => {
    const project = await getProjectByIdOrThrow(projectId);
    await assertProjectWriteAccess(userId, project.workspace.toString(), project);

    if (body.name !== undefined) {
        project.name = body.name;
    }
    if (body.description !== undefined) {
        project.description = body.description ?? "";
    }
    if (body.status !== undefined) {
        project.status = body.status;
        if (body.status === ProjectStatusEnum.ARCHIVED) {
            project.archivedAt = new Date();
        } else {
            project.archivedAt = null;
        }
    }
    if (body.startDate !== undefined) {
        project.startDate = body.startDate;
    }
    if (body.endDate !== undefined) {
        project.endDate = body.endDate;
    }

    await project.save();
    return { project };
};

export const softDeleteProjectService = async (userId: string, projectId: string) => {
    const project = await getProjectByIdOrThrow(projectId);
    await assertProjectWriteAccess(userId, project.workspace.toString(), project);

    project.status = ProjectStatusEnum.ARCHIVED;
    project.archivedAt = new Date();
    await project.save();

    return { message: "Project archived successfully" };
};

export const listProjectsInWorkspaceService = async (
    workspaceId: string,
    userId: string,
    query: { page: number; limit: number; status?: typeof ProjectStatusEnum.ACTIVE | typeof ProjectStatusEnum.ARCHIVED | undefined }
) => {
    await assertWorkspaceMember(userId, workspaceId);

    const filter: mongoose.FilterQuery<ProjectDocument> = { workspace: workspaceId };
    if (query.status) {
        filter.status = query.status;
    }

    const skip = (query.page - 1) * query.limit;

    const [projects, total] = await Promise.all([
        ProjectModel.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(query.limit)
            .populate("createdBy", "name email avatar")
            .lean(),
        ProjectModel.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
        projects,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages,
        },
    };
};

export const getProjectByIdService = async (userId: string, projectId: string) => {
    const project = await ProjectModel.findById(projectId).populate("createdBy", "name email avatar");
    if (!project) {
        throw new NotFoundException("Project not found");
    }
    await assertProjectReadAccess(userId, project);
    return { project };
};

export const getProjectAnalyticsService = async (workspaceId: string) => {
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw new NotFoundException("Workspace not found");
    }

    const wsObjectId = new mongoose.Types.ObjectId(workspaceId);
    const match = { workspace: wsObjectId };

    const [totalsAgg, perMonth] = await Promise.all([
        ProjectModel.aggregate<{
            total: number;
            active: number;
            archived: number;
        }>([
            { $match: match },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ["$status", ProjectStatusEnum.ACTIVE] }, 1, 0] },
                    },
                    archived: {
                        $sum: { $cond: [{ $eq: ["$status", ProjectStatusEnum.ARCHIVED] }, 1, 0] },
                    },
                },
            },
        ]),
        ProjectModel.aggregate<{ month: string; count: number }>([
            { $match: match },
            {
                $group: {
                    _id: {
                        y: { $year: "$createdAt" },
                        m: { $month: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.y": 1, "_id.m": 1 } },
            {
                $project: {
                    _id: 0,
                    month: {
                        $concat: [
                            { $toString: "$_id.y" },
                            "-",
                            {
                                $cond: [
                                    { $lt: ["$_id.m", 10] },
                                    { $concat: ["0", { $toString: "$_id.m" }] },
                                    { $toString: "$_id.m" },
                                ],
                            },
                        ],
                    },
                    count: 1,
                },
            },
        ]),
    ]);

    const totals = totalsAgg[0] ?? { total: 0, active: 0, archived: 0 };

    return {
        analytics: {
            totalProjects: totals.total,
            activeCount: totals.active,
            archivedCount: totals.archived,
            projectsCreatedPerMonth: perMonth,
        },
    };


};

export const getProjectTaskAnalyticsService_New = async (
    workspaceId: string,
    projectId: string
) => {
    // 1. Kiểm tra Workspace tồn tại
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw new NotFoundException("Workspace not found");
    }

    const wsObjectId = new mongoose.Types.ObjectId(workspaceId);
    const projObjectId = new mongoose.Types.ObjectId(projectId);

    // Lọc theo cả Workspace và đúng Project ID từ Frontend gửi lên
    const match = {
        workspace: wsObjectId,
        project: projObjectId
    };

    const now = new Date();

    // 2. Chạy Aggregation đếm dữ liệu Task
    const [taskTotalsAgg] = await TaskModel.aggregate<{
        total: number;
        completed: number;
        overdue: number;
    }>([
        { $match: match },
        {
            $group: {
                _id: null,
                // Tổng số task
                total: { $sum: 1 },

                completed: {
                    $sum: {
                        $cond: [{ $eq: ["$status", TaskStatusEnum.DONE] }, 1, 0]
                    },
                },

                overdue: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $lt: ["$dueDate", now] },
                                    { $ne: ["$status", TaskStatusEnum.DONE] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },
            },
        },
    ]);

    const totals = taskTotalsAgg ?? { total: 0, completed: 0, overdue: 0 };

    return {
        analytics: {
            totalTasks: totals.total,
            overdueTasks: totals.overdue,
            completedTasks: totals.completed,
        },
    };
};
