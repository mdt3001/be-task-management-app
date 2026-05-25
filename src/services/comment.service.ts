import CommentModel from "../models/comment.model";
import { BadRequestException, NotFoundException } from "../utils/appError";
import { assertTaskWorkspaceMember, getTaskByIdOrThrow } from "./task.service";
import { normalizeDescription } from "../utils/tiptap-doc.util";
import { emitTaskCommentCreatedRealtime } from "./task-realtime.service";

type UserPopulated = { _id?: unknown; name?: string; avatar?: string | null };

const mapAuthor = (user: UserPopulated | null | undefined) => {
    if (!user || typeof user !== "object") {
        return null;
    }
    return {
        _id: String(user._id),
        name: user.name ?? "Unknown",
        profilePicture: user.avatar ?? null,
    };
};

export const listTaskCommentsService = async (userId: string, taskId: string, workspaceId: string) => {
    const task = await getTaskByIdOrThrow(taskId);
    if (task.workspace.toString() !== workspaceId) {
        throw new BadRequestException("Task does not belong to this workspace");
    }
    await assertTaskWorkspaceMember(userId, workspaceId);

    const comments = await CommentModel.find({ taskId, deletedAt: null })
        .sort({ createdAt: -1 })
        .populate("authorId", "name avatar")
        .lean();

    return {
        comments: comments.map((c) => ({
            _id: String(c._id),
            content: (() => {
                if (typeof c.content === "string" && c.content.trim().startsWith("{")) {
                    try {
                        return normalizeDescription(JSON.parse(c.content));
                    } catch {
                        return normalizeDescription(c.content);
                    }
                }
                return normalizeDescription(c.content);
            })(),
            author: mapAuthor(c.authorId as UserPopulated),
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        })),
    };
};

export const createTaskCommentService = async (
    userId: string,
    taskId: string,
    workspaceId: string,
    content: unknown
) => {
    const task = await getTaskByIdOrThrow(taskId);
    if (task.workspace.toString() !== workspaceId) {
        throw new BadRequestException("Task does not belong to this workspace");
    }
    await assertTaskWorkspaceMember(userId, workspaceId);

    const doc = normalizeDescription(content);
    const comment = await CommentModel.create({
        taskId,
        workspaceId,
        authorId: userId,
        content: JSON.stringify(doc),
        parentCommentId: null,
    });

    const populated = await CommentModel.findById(comment._id)
        .populate("authorId", "name avatar")
        .lean();

    const mappedComment = {
        _id: String(populated!._id),
        content: doc,
        author: mapAuthor(populated!.authorId as UserPopulated),
        createdAt: populated!.createdAt,
        updatedAt: populated!.updatedAt,
    };

    emitTaskCommentCreatedRealtime({
        workspaceId,
        projectId: task.project.toString(),
        taskId,
        actorId: userId,
        comment: mappedComment,
    });

    return { comment: mappedComment };
};
