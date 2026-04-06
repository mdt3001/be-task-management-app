import mongoose from "mongoose";
import { generateInviteCode } from "../utils/uuid";

export interface Workspace {
    name: string;
    description: string | null;
    owner: mongoose.Types.ObjectId;
    inviteCode: string;
    createdAt: Date;
    updatedAt: Date;
};

export interface WorkspaceDocument extends mongoose.Document, Workspace {
    resetInviteCode(): void;
}

const workspaceSchema = new mongoose.Schema<WorkspaceDocument>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, required: false, trim: true, default: null },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        inviteCode: { type: String, required: true, unique: true, default: generateInviteCode },
    },
    {
        timestamps: true,
    }
);

workspaceSchema.methods.resetInviteCode = function (
    this: WorkspaceDocument
) {
    this.inviteCode = generateInviteCode();
};

const WorkspaceModel = mongoose.model<WorkspaceDocument>("Workspace", workspaceSchema);
export default WorkspaceModel;
