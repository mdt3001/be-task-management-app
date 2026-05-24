import { Server as HttpServer } from "http";
import { Request, Response, NextFunction } from "express";
import { Server, Socket } from "socket.io";
import passport from "passport";
import { config } from "./app.config";
import { sessionMiddleware } from "./session.config";
import {
    assertProjectRoomAccess,
    assertTaskRoomAccess,
    assertWorkspaceRoomAccess,
} from "../services/socket-room.service";

export const SOCKET_EVENTS = {
    TASK_ASSIGNED: "task:assigned",
    TASK_CREATED: "task:created",
    TASK_UPDATED: "task:updated",
    TASK_DELETED: "task:deleted",
    TASK_COMMENT_CREATED: "task:comment:created",
} as const;

export const SOCKET_CLIENT_EVENTS = {
    WORKSPACE_JOIN: "workspace:join",
    WORKSPACE_LEAVE: "workspace:leave",
    PROJECT_JOIN: "project:join",
    PROJECT_LEAVE: "project:leave",
    TASK_JOIN: "task:join",
    TASK_LEAVE: "task:leave",
} as const;

export const socketRoom = {
    user: (userId: string) => `user:${userId}`,
    workspace: (workspaceId: string) => `workspace:${workspaceId}`,
    project: (projectId: string) => `project:${projectId}`,
    task: (taskId: string) => `task:${taskId}`,
};

let io: Server | null = null;

type ExpressMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => void;

const wrapMiddleware = (middleware: ExpressMiddleware) => {
    return (socket: Socket, next: (err?: Error) => void) => {
        middleware(socket.request as Request, {} as Response, next as NextFunction);
    };
};

const registerRoomHandlers = (socket: Socket, userId: string) => {
    socket.on(
        SOCKET_CLIENT_EVENTS.WORKSPACE_JOIN,
        async (data: { workspaceId?: string }, ack?: (res: { ok: boolean }) => void) => {
            try {
                if (!data?.workspaceId) {
                    ack?.({ ok: false });
                    return;
                }

                await assertWorkspaceRoomAccess(userId, data.workspaceId);
                await socket.join(socketRoom.workspace(data.workspaceId));
                ack?.({ ok: true });
            } catch {
                ack?.({ ok: false });
            }

        }

    );

    socket.on(SOCKET_CLIENT_EVENTS.WORKSPACE_LEAVE, (data: { workspaceId?: string }) => {
        if (data?.workspaceId) {
            socket.leave(socketRoom.workspace(data.workspaceId));
        }
    });

    socket.on(
        SOCKET_CLIENT_EVENTS.PROJECT_JOIN,
        async (data: { projectId?: string }, ack?: (res: { ok: boolean }) => void) => {
            try {
                if (!data?.projectId) {
                    ack?.({ ok: false });
                    return;
                }
                await assertProjectRoomAccess(userId, data.projectId);
                await socket.join(socketRoom.project(data.projectId));

                ack?.({ ok: true });

            } catch {
                ack?.({ ok: false });
            }
        }
    );

    socket.on(SOCKET_CLIENT_EVENTS.PROJECT_LEAVE, (data: { projectId?: string }) => {
        if (data?.projectId) {
            socket.leave(socketRoom.project(data.projectId));
        }
    });

    socket.on(
        SOCKET_CLIENT_EVENTS.TASK_JOIN,
        async (data: { taskId?: string }, ack?: (res: { ok: boolean }) => void) => {
            try {
                if (!data?.taskId) {
                    ack?.({ ok: false });
                    return;
                }
                await assertTaskRoomAccess(userId, data.taskId);
                await socket.join(socketRoom.task(data.taskId));

                ack?.({ ok: true });
            } catch {
                ack?.({ ok: false });
            }
        }
    );

    socket.on(SOCKET_CLIENT_EVENTS.TASK_LEAVE, (data: { taskId?: string }) => {

        if (data?.taskId) {
            socket.leave(socketRoom.task(data.taskId));
        }
    });
};



export const initSocketServer = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: config.FRONTEND_ORIGIN,
            credentials: true,
        },
    });

    io.use(wrapMiddleware(sessionMiddleware));
    io.use(wrapMiddleware(passport.initialize()));
    io.use(wrapMiddleware(passport.session()));
    io.on("connection", (socket: Socket) => {
        const req = socket.request as { user?: { _id?: { toString: () => string } } };
        const userId = req.user?._id?.toString();
        if (!userId) {
            socket.disconnect(true);
            return;
        }
        socket.join(socketRoom.user(userId));
        registerRoomHandlers(socket, userId);
    });
    return io;
};

export const getSocketServer = () => {
    if (!io) {
        throw new Error("Socket server has not been initialized");
    }
    return io;
};

export const emitToUser = (userId: string, event: string, payload: unknown) => {
    if (!io) {
        return;
    }
    io.to(socketRoom.user(userId)).emit(event, payload);
};

export const emitToWorkspace = (workspaceId: string, event: string, payload: unknown) => {
    if (!io) {
        return;
    }

    io.to(socketRoom.workspace(workspaceId)).emit(event, payload);
};

export const emitToProject = (projectId: string, event: string, payload: unknown) => {
    if (!io) {
        return;
    }
    io.to(socketRoom.project(projectId)).emit(event, payload);
};

export const emitToTask = (taskId: string, event: string, payload: unknown) => {
    if (!io) {
        return;
    }
    io.to(socketRoom.task(taskId)).emit(event, payload);
};
