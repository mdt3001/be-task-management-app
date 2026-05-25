import {
    emitToProject,
    emitToTask,
    emitToWorkspace,
    SOCKET_EVENTS,
} from "../config/socket.config";

type TaskRealtimeBase = {
    workspaceId: string;
    projectId: string;
    taskId: string;
    actorId: string;
};

export const emitTaskCreatedRealtime = (payload: TaskRealtimeBase & { task: unknown }) => {
    emitToWorkspace(payload.workspaceId, SOCKET_EVENTS.TASK_CREATED, payload);
    emitToProject(payload.projectId, SOCKET_EVENTS.TASK_CREATED, payload);
};

export const emitTaskUpdatedRealtime = (payload: TaskRealtimeBase & { task: unknown }) => {
    emitToWorkspace(payload.workspaceId, SOCKET_EVENTS.TASK_UPDATED, payload);
    emitToProject(payload.projectId, SOCKET_EVENTS.TASK_UPDATED, payload);
    emitToTask(payload.taskId, SOCKET_EVENTS.TASK_UPDATED, payload);
};

export const emitTaskDeletedRealtime = (payload: TaskRealtimeBase) => {
    emitToWorkspace(payload.workspaceId, SOCKET_EVENTS.TASK_DELETED, payload);
    emitToProject(payload.projectId, SOCKET_EVENTS.TASK_DELETED, payload);
    emitToTask(payload.taskId, SOCKET_EVENTS.TASK_DELETED, payload);
};

export const emitTaskCommentCreatedRealtime = (
    payload: TaskRealtimeBase & { comment: unknown }
) => {
    emitToTask(payload.taskId, SOCKET_EVENTS.TASK_COMMENT_CREATED, payload);
};
