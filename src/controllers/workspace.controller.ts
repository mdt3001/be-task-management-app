import { changeMemberRoleSchema } from './../validation/workspace.validation';
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { createWorkspaceSchema, getWorkspaceByIdSchema } from "../validation/workspace.validation";
import { HTTPSTATUS } from '../config/http.config';
import { Request, Response } from "express";
import { changeWorkspaceMemberRoleService, createWorkspaceService, deleteWorkspaceService, getAllWorkspacesService, getMemberRoleInWorkspace, getWorkspaceAnalyticsService, getWorkspaceByIdService, getWorkspaceMembersService, leaveWorkspaceService, updateWorkspaceByIdService } from "../services/workspace.service";
import { PermissionsEnum } from "../enums/role.enum";
import { roleGuard } from "../utils/roleGuard";

export const createWorkspaceController = asyncHandler(
    async (req: Request, res: Response) => {
        const body = createWorkspaceSchema.parse(req.body);

        const userId = req.user?._id;

        const { workspace } = await createWorkspaceService(userId, body);

        return res.status(HTTPSTATUS.CREATED).json({
            message: "Workspace created successfully",
            workspace,
        });
    }
);

export const getAllWorkspacesController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;
        const workspaces = await getAllWorkspacesService(userId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Workspaces retrieved successfully",
            workspaces,
        });
    }
);

export const getWorkspaceByIdController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id;
        const workspaceId = getWorkspaceByIdSchema.parse(req.params.id);
        const workspace = await getWorkspaceByIdService(workspaceId, userId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Workspace retrieved successfully",
            workspace,
        });
    }
);

export const getWorkspaceMembersController = asyncHandler(
    async (req: Request, res: Response) => {
        const workspaceId = getWorkspaceByIdSchema.parse(req.params.id);
        const userId = req.user?._id;
        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [PermissionsEnum.VIEW_ONLY]);

        const { members, roles } = await getWorkspaceMembersService(workspaceId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Workspace members retrieved successfully",
            members,
            roles,
        });
    }
);

export const getWorkspaceAnalyticsController = asyncHandler(
    async (req: Request, res: Response) => {
        const workspaceId = getWorkspaceByIdSchema.parse(req.params.id);
        const userId = req.user?._id;
        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [PermissionsEnum.VIEW_ONLY]);
        const { analytics } = await getWorkspaceAnalyticsService(workspaceId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Workspace analytics retrieved successfully",
            analytics,
        });
    }
);

export const changeWorkspaceMemberRoleController = asyncHandler(
    async (req: Request, res: Response) => {
        const workspaceId = getWorkspaceByIdSchema.parse(req.params.id);
        const userId = req.user?._id;
        const { memberId, roleId } = changeMemberRoleSchema.parse(req.body);
        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [PermissionsEnum.CHANGE_MEMBER_ROLE]);

        const { member } = await changeWorkspaceMemberRoleService(workspaceId, memberId, roleId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Member role changed successfully",
            member,
        });
    }
);

export const updateWorkspaceByIdController = asyncHandler(
    async (req: Request, res: Response) => {
        const workspaceId = getWorkspaceByIdSchema.parse(req.params.id);
        const { name, description } = req.body;
        const userId = req.user?._id;
        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [PermissionsEnum.EDIT_WORKSPACE]);
        const { workspace } = await updateWorkspaceByIdService(workspaceId, { name, description });

        return res.status(HTTPSTATUS.OK).json({
            message: "Workspace updated successfully",
            workspace,
        });
    }
);

export const leaveWorkspaceController = asyncHandler(
    async (req: Request, res: Response) => {
        const workspaceId = getWorkspaceByIdSchema.parse(req.params.id);
        const userId = req.user?._id;

        const result = await leaveWorkspaceService(userId, workspaceId);

        return res.status(HTTPSTATUS.OK).json(result);
    }
);

export const deleteWorkspaceController = asyncHandler(
    async (req: Request, res: Response) => {
        const workspaceId = getWorkspaceByIdSchema.parse(req.params.id);
        const userId = req.user?._id;

        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [PermissionsEnum.DELETE_WORKSPACE]);

        const result = await deleteWorkspaceService(userId, workspaceId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Workspace deleted successfully",
            result,
        });
    }
);
