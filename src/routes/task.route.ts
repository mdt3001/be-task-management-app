import { Router } from "express";
import {
    createTaskController,
    deleteTaskController,
    getTaskByIdController,
    getTaskEnumsController,
    listTasksByProjectController,
    updateTaskController,
} from "../controllers/task.controller";

export const projectTaskRoutes = Router();
export const taskRoutes = Router();

projectTaskRoutes.post("/projects/:projectId/tasks", createTaskController);
projectTaskRoutes.get("/projects/:projectId/tasks", listTasksByProjectController);

taskRoutes.get("/tasks/enums", getTaskEnumsController);
taskRoutes.get("/tasks/:taskId", getTaskByIdController);
taskRoutes.put("/tasks/:taskId", updateTaskController);
taskRoutes.delete("/tasks/:taskId", deleteTaskController);
