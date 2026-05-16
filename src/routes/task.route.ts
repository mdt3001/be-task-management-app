import { Router } from "express";
import {
    createTaskController,
    deleteTaskController,
    listAllTasksInWorkspaceController,
    updateTaskController,
} from "../controllers/task.controller";

export const taskRoutes = Router();

taskRoutes.post(
    "/task/project/:projectId/workspace/:workspaceId/create",
    createTaskController
);
taskRoutes.get(
    "/task/workspace/:workspaceId/all",
    listAllTasksInWorkspaceController
);
taskRoutes.put(
    "/task/:taskId/project/:projectId/workspace/:workspaceId/update",
    updateTaskController
);
taskRoutes.delete(
    "/task/:taskId/workspace/:workspaceId/delete",
    deleteTaskController
);
