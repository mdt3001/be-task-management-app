import mongoose from "mongoose";
import WorkspaceModel, { WorkspaceDocument } from "../models/workspace.model";
import { generateInviteCode } from "../utils/uuid";
import { InternalServerException } from "../utils/appError";

const MAX_INVITE_CODE_RETRIES = 3;
const MONGO_DUPLICATE_KEY_ERROR = 11000;

const isInviteCodeDuplicateError = (err: unknown): boolean => {
    return (
        typeof err === "object" &&
        err !== null &&
        (err as any).code === MONGO_DUPLICATE_KEY_ERROR &&
        (err as any).keyPattern?.inviteCode !== undefined
    );
};

export const createWorkspace = async (
    name: string,
    owner: mongoose.Types.ObjectId,
    description?: string | null
): Promise<WorkspaceDocument> => {
    for (let attempt = 0; attempt < MAX_INVITE_CODE_RETRIES; attempt++) {
        try {
            return await WorkspaceModel.create({
                name,
                description: description ?? null,
                owner,
                inviteCode: generateInviteCode(),
            });
        } catch (err) {
            if (isInviteCodeDuplicateError(err) && attempt < MAX_INVITE_CODE_RETRIES - 1) {
                continue;
            }
            throw new InternalServerException("Failed to create workspace");
        }
    }
    throw new InternalServerException("Failed to generate a unique invite code");
};

export const resetWorkspaceInviteCode = async (
    workspace: WorkspaceDocument
): Promise<WorkspaceDocument> => {
    for (let attempt = 0; attempt < MAX_INVITE_CODE_RETRIES; attempt++) {
        try {
            workspace.resetInviteCode();
            return await workspace.save();
        } catch (err) {
            if (isInviteCodeDuplicateError(err) && attempt < MAX_INVITE_CODE_RETRIES - 1) {
                continue;
            }
            throw new InternalServerException("Failed to reset workspace invite code");
        }
    }
    throw new InternalServerException("Failed to generate a unique invite code");
};
