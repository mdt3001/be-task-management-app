import { Router } from "express";
import {
    createProjectController,
    deleteProjectController,
    getProjectAnalyticsController,
    getProjectByIdController,
    listProjectsController,
    updateProjectController,
} from "../controllers/project.controller";

/** Mounted at `/workspaces/:workspaceId/projects` */
export const workspaceProjectRoutes = Router();

workspaceProjectRoutes.get("/:workspaceId/projects/analytics", getProjectAnalyticsController);
workspaceProjectRoutes.get("/:workspaceId/projects", listProjectsController);
workspaceProjectRoutes.post("/:workspaceId/projects", createProjectController);
workspaceProjectRoutes.get("/:workspaceId/projects/:projectId", getProjectByIdController);
workspaceProjectRoutes.put("/:workspaceId/projects/:projectId", updateProjectController);
workspaceProjectRoutes.delete("/:workspaceId/projects/:projectId", deleteProjectController);
