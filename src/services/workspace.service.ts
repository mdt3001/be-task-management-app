import { Role } from './../models/role.model';
import mongoose from "mongoose";
import { RolesEnum } from "../enums/role.enum";
import MemberModel from "../models/member.model";
import RoleModel from "../models/role.model";
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import { ForbiddenException, NotFoundException } from "../utils/appError";
import TaskModel from '../models/task.model';
import { TaskStatusEnum } from '../enums/task.enum';
import ProjectModel from '../models/project.model';

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
            throw new NotFoundException("User not found");
        }

        const ownerRole = await RoleModel.findOne({ name: RolesEnum.OWNER }).session(session);

        if (!ownerRole) {
            throw new NotFoundException("Owner role not found");
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

export const getAllWorkspacesService = async (userId: string) => {
    const memberships = await MemberModel.find({ userId: userId }).populate('workspaceId');
    const workspaces = memberships.map(membership => membership.workspaceId);
    return workspaces;
}

export const getWorkspaceByIdService = async (workspaceId: string, userId: string) => {
    const menbership = await MemberModel.findOne({ workspaceId: workspaceId, userId: userId });
    if (!menbership) {
        throw new NotFoundException("User is not a member of this workspace");
    }

    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace) {
        throw new NotFoundException("Workspace not found");
    }

    const members = await MemberModel.find({ workspaceId: workspace._id }).populate("role");

    const workspaceWithMembers = {
        ...workspace.toObject(),
        members,
    };

    return workspaceWithMembers;
}

export const getWorkspaceMembersService = async (workspaceId: string) => {
    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace) {
        throw new NotFoundException("Workspace not found");
    }

    const members = await MemberModel.find({ workspaceId: workspaceId })
        .populate("userId", "name email avatar")
        .populate("role", "name");
    const roles = await RoleModel.find({}, { name: 1, _id: 1 })
        .select("-permissions")
        .lean();

    return { members, roles };
}

export const getMemberRoleInWorkspace = async (userId: string, workspaceId: string) => {
    const member = await MemberModel.findOne({ userId: userId, workspaceId: workspaceId }).populate("role");

    if (!member || !member.role || typeof member.role === "string" || !("name" in member.role)) {
        throw new NotFoundException("Member role not found");
    }

    return { role: member.role.name };
}

export const getWorkspaceAnalyticsService = async (workspaceId: string) => {
    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace) {
        throw new NotFoundException("Workspace not found");
    }

    const currentDate = new Date();
    const totalTasks = await TaskModel.countDocuments({ workspace: workspaceId });
    const overdueTasks = await TaskModel.countDocuments({ workspace: workspaceId, dueDate: { $lt: currentDate }, status: { $ne: TaskStatusEnum.DONE } });
    const completedTasks = await TaskModel.countDocuments({ workspace: workspaceId, status: TaskStatusEnum.DONE });
    const analytics = {
        totalTasks,
        overdueTasks,
        completedTasks,
    };

    return { analytics };
}

export const changeWorkspaceMemberRoleService = async (workspaceId: string, memberId: string, newRoleId: string) => {
    const member = await MemberModel.findOne({ workspaceId: workspaceId, userId: memberId });

    if (!member) {
        throw new NotFoundException("Member not found in workspace");
    }

    const newRole = await RoleModel.findById(newRoleId);

    if (!newRole) {
        throw new NotFoundException("Role not found");
    }

    member.role = newRole._id;
    await member.save();
    return { member };
}

export const updateWorkspaceByIdService = async (workspaceId: string, body: { name?: string; description?: string | undefined }) => {
    const { name, description } = body;
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw new NotFoundException("Workspace not found");
    }

    if (name) {
        workspace.name = name;
    }

    if (description) {
        workspace.description = description;
    }

    await workspace.save();
    return { workspace };
}

export const leaveWorkspaceService = async (userId: string, workspaceId: string) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const member = await MemberModel.findOne({ userId: userId, workspaceId: workspaceId }).session(session);

        if (!member) {
            throw new NotFoundException("Member not found in workspace");
        }

        // Check if user is the only owner
        const workspace = await WorkspaceModel.findById(workspaceId).session(session);
        if (!workspace) {
            throw new NotFoundException("Workspace not found");
        }

        const ownerRole = await RoleModel.findOne({ name: RolesEnum.OWNER }).session(session);

        if (!ownerRole) {
            throw new NotFoundException("Owner role not found");
        }

        const ownerCount = await MemberModel.countDocuments({
            workspaceId: workspaceId,
            role: ownerRole?._id
        }).session(session);

        if (member.role === ownerRole?._id && ownerCount === 1) {
            throw new Error("Cannot leave workspace as the only owner. Transfer ownership first.");
        }

        // Remove user from workspace
        await MemberModel.deleteOne({ userId: userId, workspaceId: workspaceId }).session(session);

        // If user has currentWorkspace set to this workspace, reset it
        const user = await UserModel.findById(userId).session(session);
        if (user && user.currentWorkspace?.toString() === workspaceId) {
            await UserModel.updateOne(
                { _id: user._id },
                { $unset: { currentWorkspace: "" } },
                { session }
            );
        }

        await session.commitTransaction();
        return { message: "Successfully left workspace" };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

export const deleteWorkspaceService = async (userId: string, workspaceId: string) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const workspace = await WorkspaceModel.findById(workspaceId).session(session);
        if (!workspace) {
            throw new NotFoundException("Workspace not found");
        }

        // Check if user is owner
        const ownerRole = await RoleModel.findOne({ name: RolesEnum.OWNER }).session(session);

        if (!ownerRole) {
            throw new NotFoundException("Owner role not found");
        }

        const userMember = await MemberModel.findOne({
            userId: userId,
            workspaceId: workspaceId,
            role: ownerRole._id
        }).session(session);

        if (!userMember) {
            throw new ForbiddenException("Only workspace owner can delete workspace");
        }

        //Delete all projects in workspace
        await ProjectModel.deleteMany({ workspace: workspaceId }).session(session)

        // Delete all tasks in workspace
        await TaskModel.deleteMany({ workspace: workspaceId }).session(session);

        // Delete all members in workspace
        await MemberModel.deleteMany({ workspaceId: workspaceId }).session(session);

        // Remove `currentWorkspace` field for all users in this workspace
        await UserModel.updateMany(
            { currentWorkspace: workspaceId },
            { $unset: { currentWorkspace: "" } },
            { session }
        );

        // Delete workspace
        await WorkspaceModel.findByIdAndDelete(workspaceId).session(session);

        await session.commitTransaction();
        return { message: "Workspace deleted successfully" };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}
