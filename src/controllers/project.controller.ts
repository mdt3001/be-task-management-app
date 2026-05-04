import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
    createProjectSchema,
    listProjectsQuerySchema,
    projectIdParamSchema,
    updateProjectSchema,
    workspaceIdParamSchema,
} from "../validation/project.validation";
import {
    createProjectService,
    getProjectAnalyticsService,
    getProjectByIdService,
    listProjectsInWorkspaceService,
    softDeleteProjectService,
    updateProjectService,
} from "../services/project.service";
import { getMemberRoleInWorkspace } from "../services/workspace.service";
import { PermissionsEnum } from "../enums/role.enum";
import { roleGuard } from "../utils/roleGuard";

export const createProjectController = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = workspaceIdParamSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;
    const body = createProjectSchema.parse(req.body);
    const { project } = await createProjectService(String(userId), workspaceId, body);

    return res.status(HTTPSTATUS.CREATED).json({
        message: "Project created successfully",
        project,
    });
});

export const listProjectsController = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = workspaceIdParamSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;
    const query = listProjectsQuerySchema.parse(req.query);

    const { projects, pagination } = await listProjectsInWorkspaceService(workspaceId, String(userId), query);

    return res.status(HTTPSTATUS.OK).json({
        message: "Projects retrieved successfully",
        projects,
        pagination,
    });
});

export const getProjectAnalyticsController = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = workspaceIdParamSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;
    const { role } = await getMemberRoleInWorkspace(String(userId), workspaceId);
    roleGuard(role, [PermissionsEnum.VIEW_ONLY]);

    const { analytics } = await getProjectAnalyticsService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Project analytics retrieved successfully",
        analytics,
    });
});

export const getProjectByIdController = asyncHandler(async (req: Request, res: Response) => {
    const projectId = projectIdParamSchema.parse(req.params.projectId);
    const userId = req.user?._id;

    const { project } = await getProjectByIdService(String(userId), projectId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Project retrieved successfully",
        project,
    });
});

export const updateProjectController = asyncHandler(async (req: Request, res: Response) => {
    const projectId = projectIdParamSchema.parse(req.params.projectId);
    const userId = req.user?._id;
    const body = updateProjectSchema.parse(req.body);
    const { project } = await updateProjectService(String(userId), projectId, body);

    return res.status(HTTPSTATUS.OK).json({
        message: "Project updated successfully",
        project,
    });
});

export const deleteProjectController = asyncHandler(async (req: Request, res: Response) => {
    const projectId = projectIdParamSchema.parse(req.params.projectId);
    const userId = req.user?._id;

    const result = await softDeleteProjectService(String(userId), projectId);

    return res.status(HTTPSTATUS.OK).json(result);
});
