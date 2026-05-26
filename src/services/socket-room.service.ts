import {
    assertTaskWorkspaceMember,
    getProjectByIdOrThrow,
    getTaskByIdOrThrow,
} from "./task.service";

export const assertProjectRoomAccess = async (userId: string, projectId: string) => {
    const project = await getProjectByIdOrThrow(projectId);
    await assertTaskWorkspaceMember(userId, project.workspace.toString());
    return project;
};

export const assertTaskRoomAccess = async (userId: string, taskId: string) => {
    const task = await getTaskByIdOrThrow(taskId);
    await assertTaskWorkspaceMember(userId, task.workspace.toString());
    return task;
};

export const assertWorkspaceRoomAccess = async (userId: string, workspaceId: string) => {
    await assertTaskWorkspaceMember(userId, workspaceId);
};
