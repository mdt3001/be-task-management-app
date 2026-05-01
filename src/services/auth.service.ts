import { ProviderEnum, ProviderType } from './../enums/account-provider.enum';
import WorkspaceModel from './../models/workspace.model';
import UserModel from "../models/user.model";
import mongoose from "mongoose";
import AccountModel from '../models/account.model';
import RoleModel from '../models/role.model';
import { RolesEnum } from '../enums/role.enum';
import { BadRequestException, NotFoundException } from '../utils/appError';
import MemberModel from '../models/member.model';

export const loginOrCreateAccountService = async (data: {
    provider: ProviderType;
    displayName: string;
    providerId: string;
    picture?: string;
    email?: string;
}) => {
    const { provider, displayName, providerId, picture, email: rawEmail } = data;
    // Normalize email once: lowercase and trim
    const email = rawEmail ? rawEmail.toLowerCase().trim() : undefined;

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // Step 1: Try to find existing account by provider + providerId
        let account = await AccountModel.findOne({ provider, providerId }).session(session);
        let user;
        let isNewUser = false;

        if (account) {
            // Account exists -> load user from account
            user = await UserModel.findById(account.userId).session(session);
            if (!user) {
                throw new NotFoundException("User linked to account not found");
            }
        } else {
            // Step 2: No account found, try to find user by email
            user = await UserModel.findOne({ email }).session(session);

            if (!user) {
                // Step 3: No user found, create new user (onboarding flow)
                isNewUser = true;
                user = new UserModel({
                    email,
                    name: displayName,
                    avatar: picture || null,
                });
                await user.save({ session });
            }

            // Step 5: Ensure Account exists for this provider identity
            // (always create account if not found earlier)
            account = new AccountModel({
                userId: user._id,
                provider,
                providerId,
            });
            await account.save({ session });
        }

        // Step 6: Setup onboarding only if user is new
        if (isNewUser) {
            // Create default workspace
            const workspace = new WorkspaceModel({
                name: `My Workspace`,
                description: `Workspace created for ${user.name}`,
                owner: user._id,
            });
            await workspace.save({ session });

            // Get OWNER role
            const ownerRole = await RoleModel.findOne({
                name: RolesEnum.OWNER,
            }).session(session);

            if (!ownerRole) {
                throw new NotFoundException("Owner role not found");
            }

            // Create member with OWNER role
            const member = new MemberModel({
                userId: user._id,
                workspaceId: workspace._id,
                role: ownerRole._id,
                joinedAt: new Date(),
            });
            await member.save({ session });

            // Set current workspace for user
            user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
            await user.save({ session });
        }

        // Step 7: Commit transaction
        await session.commitTransaction();

        return { user };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();   
    }
}

export const registerService = async (data: {
    email: string;
    name: string;
    password: string;
}) => {
    const { email: rawEmail, name, password } = data;
    // Normalize email once: lowercase and trim
    const email = rawEmail.toLowerCase().trim();
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const existingUser = await UserModel.findOne({ email }).session(session);
        if (existingUser) {
            throw new BadRequestException("Email is already registered");
        }

        // Create new user
        const user = new UserModel({
            email,
            name,
            password,
        });
        await user.save({ session });

        const account = new AccountModel({
            userId: user._id,
            provider: ProviderEnum.EMAIL,
            providerId: email,
        });
        await account.save({ session });

        const workspace = new WorkspaceModel({
            name: `My Workspace`,
            description: `Workspace created for ${user.name}`,
            owner: user._id,
        });
        await workspace.save({ session });

        const ownerRole = await RoleModel.findOne({
            name: RolesEnum.OWNER,
        }).session(session);

        if (!ownerRole) {
            throw new NotFoundException("Owner role not found");
        }

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

        return {
            userId: user._id,
            workspaceId: workspace._id,
        }

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
