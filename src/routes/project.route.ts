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

/** Mounted at `/projects` */
export const projectDetailRoutes = Router();

projectDetailRoutes.get("/:projectId", getProjectByIdController);
projectDetailRoutes.put("/:projectId", updateProjectController);
projectDetailRoutes.delete("/:projectId", deleteProjectController);
