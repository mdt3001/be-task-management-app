import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { PermissionsEnum } from "../enums/role.enum";
import { roleGuard } from "../utils/roleGuard";
import { getMemberRoleInWorkspace } from "../services/workspace.service";
import {
    createTaskSchema,
    listTasksQuerySchema,
    projectIdParamSchema,
    taskIdParamSchema,
    updateTaskSchema,
} from "../validation/task.validation";
import {
    createTaskService,
    deleteTaskService,
    getProjectByIdOrThrow,
    getTaskByIdService,
    getTaskByIdOrThrow,
    getTaskEnumsService,
    listTasksByProjectService,
    updateTaskService,
} from "../services/task.service";

export const createTaskController = asyncHandler(async (req: Request, res: Response) => {
    const projectId = projectIdParamSchema.parse(req.params.projectId);
    const userId = req.user?._id;
    const body = createTaskSchema.parse(req.body);

    const project = await getProjectByIdOrThrow(projectId);
    const { role } = await getMemberRoleInWorkspace(String(userId), project.workspace.toString());
    roleGuard(role, [PermissionsEnum.CREATE_TASK]);

    const { task } = await createTaskService(String(userId), projectId, body);

    return res.status(HTTPSTATUS.CREATED).json({
        message: "Task created successfully",
        task,
    });
});

export const updateTaskController = asyncHandler(async (req: Request, res: Response) => {
    const taskId = taskIdParamSchema.parse(req.params.taskId);
    const userId = req.user?._id;
    const body = updateTaskSchema.parse(req.body);

    const task = await getTaskByIdOrThrow(taskId);
    const { role } = await getMemberRoleInWorkspace(String(userId), task.workspace.toString());
    roleGuard(role, [PermissionsEnum.EDIT_TASK]);

    const { task: updatedTask } = await updateTaskService(String(userId), taskId, body);

    return res.status(HTTPSTATUS.OK).json({
        message: "Task updated successfully",
        task: updatedTask,
    });
});

export const listTasksByProjectController = asyncHandler(async (req: Request, res: Response) => {
    const projectId = projectIdParamSchema.parse(req.params.projectId);
    const userId = req.user?._id;
    const query = listTasksQuerySchema.parse(req.query);

    const { tasks, pagination } = await listTasksByProjectService(String(userId), projectId, query);

    return res.status(HTTPSTATUS.OK).json({
        message: "Tasks retrieved successfully",
        tasks,
        pagination,
    });
});

export const getTaskByIdController = asyncHandler(async (req: Request, res: Response) => {
    const taskId = taskIdParamSchema.parse(req.params.taskId);
    const userId = req.user?._id;

    const { task } = await getTaskByIdService(String(userId), taskId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Task retrieved successfully",
        task,
    });
});

export const getTaskEnumsController = asyncHandler(async (_req: Request, res: Response) => {
    const enums = await getTaskEnumsService();

    return res.status(HTTPSTATUS.OK).json(enums);
});

export const deleteTaskController = asyncHandler(async (req: Request, res: Response) => {
    const taskId = taskIdParamSchema.parse(req.params.taskId);
    const userId = req.user?._id;

    const task = await getTaskByIdOrThrow(taskId);
    const { role } = await getMemberRoleInWorkspace(String(userId), task.workspace.toString());
    roleGuard(role, [PermissionsEnum.DELETE_TASK]);

    const result = await deleteTaskService(String(userId), taskId);
    return res.status(HTTPSTATUS.OK).json(result);
});
