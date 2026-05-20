import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { PermissionsEnum } from "../enums/role.enum";
import { roleGuard } from "../utils/roleGuard";
import { getMemberRoleInWorkspace } from "../services/workspace.service";
import {
    allTasksInWorkspaceQuerySchema,
    createTaskRouteParamsSchema,
    createTaskSchema,
    deleteTaskRouteParamsSchema,
    updateTaskRouteParamsSchema,
    updateTaskSchema,
    workspaceTasksRouteParamsSchema,
} from "../validation/task.validation";
import {
    createTaskService,
    deleteTaskService,
    listAllTasksInWorkspaceService,
    updateTaskService,
} from "../services/task.service";

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

export const updateTaskController = asyncHandler(async (req: Request, res: Response) => {
    const { taskId, projectId, workspaceId } = updateTaskRouteParamsSchema.parse(req.params);
    const userId = req.user?._id;
    const body = updateTaskSchema.parse(req.body);

    const { role } = await getMemberRoleInWorkspace(String(userId), workspaceId);
    roleGuard(role, [PermissionsEnum.EDIT_TASK]);

    const { task: updatedTask } = await updateTaskService(String(userId), workspaceId, projectId, taskId, body);

    return res.status(HTTPSTATUS.OK).json({
        message: "Task updated successfully",
        task: updatedTask,
    });
});

export const listAllTasksInWorkspaceController = asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId } = workspaceTasksRouteParamsSchema.parse(req.params);
    const userId = req.user?._id;
    // Dữ liệu query giờ đã được validate trơn tru qua schema mới
    const query = allTasksInWorkspaceQuerySchema.parse(req.query);

    const { tasks, pagination } = await listAllTasksInWorkspaceService(String(userId), workspaceId, query);

    return res.status(HTTPSTATUS.OK).json({
        message: "Tasks retrieved successfully",
        tasks,
        pagination,
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
