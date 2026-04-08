import mongoose, { Document, Schema } from "mongoose";
import { RoleDocument } from "./role.model";
import { MemberStatusEnum, MemberStatusEnumType } from "../enums/member.enum";

export interface Member {
    userId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    role: mongoose.Types.ObjectId | RoleDocument;
    status: MemberStatusEnumType;
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
};

export interface MemberDocument extends Document, Member { };
const memberSchema = new Schema<MemberDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
        status: { type: String, enum: Object.values(MemberStatusEnum), default: MemberStatusEnum.ACTIVE },
        joinedAt: { type: Date, default: Date.now },
    },  
    {
        timestamps: true,
    }
);

memberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
memberSchema.index({ workspaceId: 1, status: 1, joinedAt: -1 });

const MemberModel = mongoose.model<MemberDocument>("Member", memberSchema);
export default MemberModel;
