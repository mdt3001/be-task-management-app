import { Router } from "express";
import {
    createTaskCommentController,
    createTaskController,
    deleteTaskController,
    getTaskActivitiesController,
    getTaskByIdController,
    listAllTasksInWorkspaceController,
    listTaskCommentsController,
    updateTaskController,
} from "../controllers/task.controller";

export const taskRoutes = Router();

taskRoutes.post(
    "/task/project/:projectId/workspace/:workspaceId/create",
    createTaskController
);

taskRoutes.get(
    "/task/:taskId/workspace/:workspaceId/activities",
    getTaskActivitiesController
);

taskRoutes.get(
    "/task/:taskId/workspace/:workspaceId/comments",
    listTaskCommentsController
);

taskRoutes.post(
    "/task/:taskId/workspace/:workspaceId/comments",
    createTaskCommentController
);

taskRoutes.put(
    "/task/:taskId/project/:projectId/workspace/:workspaceId/update",
    updateTaskController
);

taskRoutes.delete(
    "/task/:taskId/workspace/:workspaceId/delete",
    deleteTaskController
);

taskRoutes.get(
    "/task/:taskId/workspace/:workspaceId",
    getTaskByIdController
);

taskRoutes.get(
    "/task/workspace/:workspaceId/all",
    listAllTasksInWorkspaceController
);
