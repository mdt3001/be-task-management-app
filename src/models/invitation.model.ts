import mongoose, { Document, Schema } from "mongoose";
import { InvitationStatusEnum, InvitationStatusEnumType } from "../enums/invitation.enum";

export interface Invitation {
    workspaceId: mongoose.Types.ObjectId;
    email: string;
    role: mongoose.Types.ObjectId;
    token: string;
    invitedBy: mongoose.Types.ObjectId;
    status: InvitationStatusEnumType;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface InvitationDocument extends Document, Invitation { };

const invitationSchema = new Schema<InvitationDocument>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
        token: { type: String, required: true, unique: true, index: true },
        invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: Object.values(InvitationStatusEnum), default: InvitationStatusEnum.PENDING },
        expiresAt: { type: Date, required: true },
    },
    {
        timestamps: true,
    }
);

invitationSchema.index({ workspaceId: 1, email: 1, status: 1 });

const InvitationModel = mongoose.model<InvitationDocument>("Invitation", invitationSchema);
export default InvitationModel;
