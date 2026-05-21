import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { PermissionsEnum } from "../enums/role.enum";
import { roleGuard } from "../utils/roleGuard";
import { RolePermissions } from "../utils/role-permission";
import { getMemberRoleInWorkspace } from "../services/workspace.service";
import { BadRequestException } from "../utils/appError";
import {
    allTasksInWorkspaceQuerySchema,
    createTaskRouteParamsSchema,
    createTaskSchema,
    deleteTaskRouteParamsSchema,
    getTaskRouteParamsSchema,
    updateTaskRouteParamsSchema,
    updateTaskSchema,
    workspaceTasksRouteParamsSchema,
} from "../validation/task.validation";
import {
    createTaskService,
    deleteTaskService,
    getTaskActivitiesService,
    getTaskByIdOrThrow,
    getTaskByIdService,
    listAllTasksInWorkspaceService,
    resolveTaskUpdateAccess,
    updateTaskService,
} from "../services/task.service";
import { createTaskCommentService, listTaskCommentsService } from "../services/comment.service";
import { createTaskCommentSchema } from "../validation/task.validation";

export const createTaskController = asyncHandler(async (req: Request, res: Response) => {
    const { projectId, workspaceId } = createTaskRouteParamsSchema.parse(req.params);
    const userId = req.user?._id;
    const body = createTaskSchema.parse(req.body);

    const { role } = await getMemberRoleInWorkspace(String(userId), workspaceId);
    roleGuard(role, [PermissionsEnum.CREATE_TASK]);

    const { task } = await createTaskService(String(userId), workspaceId, projectId, body);

    return res.status(HTTPSTATUS.CREATED).json({
        message: "Task created successfully",
        task,
    });
});

export const getTaskByIdController = asyncHandler(async (req: Request, res: Response) => {
    console.log("Get Task By ID Controller called with params:", req.params);
    const { taskId, workspaceId } = getTaskRouteParamsSchema.parse(req.params);
    const userId = req.user?._id;

    const { task } = await getTaskByIdService(String(userId), taskId, workspaceId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Task retrieved successfully",
        task,
    });
});

export const getTaskActivitiesController = asyncHandler(async (req: Request, res: Response) => {
    const { taskId, workspaceId } = getTaskRouteParamsSchema.parse(req.params);
    const userId = req.user?._id;

    const { activities } = await getTaskActivitiesService(String(userId), taskId, workspaceId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Activities retrieved successfully",
        activities,
    });
});

export const updateTaskController = asyncHandler(async (req: Request, res: Response) => {
    const { taskId, projectId, workspaceId } = updateTaskRouteParamsSchema.parse(req.params);
    const userId = String(req.user?._id);
    const body = updateTaskSchema.parse(req.body);

    const task = await getTaskByIdOrThrow(taskId);
    if (task.workspace.toString() !== workspaceId) {
        throw new BadRequestException("Task does not belong to this workspace");
    }
    if (task.project.toString() !== projectId) {
        throw new BadRequestException("Task does not belong to this project");
    }

    const access = await resolveTaskUpdateAccess(userId, task, body);

    if (access === "full") {
        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        const roleKey = role as keyof typeof RolePermissions;
        if (RolePermissions[roleKey]?.includes(PermissionsEnum.EDIT_TASK)) {
            roleGuard(roleKey, [PermissionsEnum.EDIT_TASK]);
        }
    }

    const { task: updatedTask } = await updateTaskService(userId, workspaceId, projectId, taskId, body);

    return res.status(HTTPSTATUS.OK).json({
        message: "Task updated successfully",
        task: updatedTask,
    });
});

export const listAllTasksInWorkspaceController = asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId } = workspaceTasksRouteParamsSchema.parse(req.params);
    const userId = req.user?._id;
    const query = allTasksInWorkspaceQuerySchema.parse(req.query);

    const { tasks, pagination } = await listAllTasksInWorkspaceService(String(userId), workspaceId, query);

    return res.status(HTTPSTATUS.OK).json({
        message: "Tasks retrieved successfully",
        tasks,
        pagination,
    });
});

export const listTaskCommentsController = asyncHandler(async (req: Request, res: Response) => {
    const { taskId, workspaceId } = getTaskRouteParamsSchema.parse(req.params);
    const userId = req.user?._id;

    const { comments } = await listTaskCommentsService(String(userId), taskId, workspaceId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Comments retrieved successfully",
        comments,
    });
});

export const createTaskCommentController = asyncHandler(async (req: Request, res: Response) => {
    const { taskId, workspaceId } = getTaskRouteParamsSchema.parse(req.params);
    const userId = req.user?._id;
    const body = createTaskCommentSchema.parse(req.body);

    const { comment } = await createTaskCommentService(String(userId), taskId, workspaceId, body.content);

    return res.status(HTTPSTATUS.CREATED).json({
        message: "Comment added successfully",
        comment,
    });
});

export const deleteTaskController = asyncHandler(async (req: Request, res: Response) => {
    const { taskId, workspaceId } = deleteTaskRouteParamsSchema.parse(req.params);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(String(userId), workspaceId);
    roleGuard(role, [PermissionsEnum.DELETE_TASK]);

    const result = await deleteTaskService(String(userId), taskId, workspaceId);
    return res.status(HTTPSTATUS.OK).json(result);
});
