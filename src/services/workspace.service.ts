import mongoose from "mongoose";
import { RolesEnum } from "../enums/role.enum";
import MemberModel from "../models/member.model";
import RoleModel from "../models/role.model";
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";

export const createWorkspaceService = async (
    userId: string,
    body: {
        name: string;
        description?: string | undefined
    }
) => {

    const { name, description } = body;
    const session = await mongoose.startSession();
    let workspace;

    try {
        session.startTransaction();

        const user = await UserModel.findById(userId).session(session);

        if (!user) {
            throw new Error("User not found");
        }

        const ownerRole = await RoleModel.findOne({ name: RolesEnum.OWNER }).session(session);

        if (!ownerRole) {
            throw new Error("Owner role not found");
        }

        workspace = new WorkspaceModel({
            name: name,
            description: description,
            owner: user._id,
        });

        await workspace.save({ session });

        const member = new MemberModel({
            userId: user._id,
            workspaceId: workspace._id,
            role: ownerRole._id,
            joinedAt: new Date(),
        });

        await member.save({ session });
        user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
        await user.save({ session });
        await session.commitTransaction();
        return { workspace };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    };
}
