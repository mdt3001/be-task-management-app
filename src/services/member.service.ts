import { RolesEnum } from '../enums/role.enum';
import { sendEmail } from '../helper/Mailer';
import MemberModel from '../models/member.model';
import RoleModel from '../models/role.model';
import { BadRequestException, NotFoundException } from '../utils/appError';
import WorkspaceModel, { Workspace } from './../models/workspace.model';


export const joinWorkspaceByInviteService = async (userId: string, inviteCode: string) => {
    const workspace = await WorkspaceModel.findOne({ inviteCode: inviteCode });

    if (!workspace) {
        throw new NotFoundException("Invalid invite code");
    }

    const existingMember = await MemberModel.findOne({ userId: userId, workspaceId: workspace._id }).exec();

    if (existingMember) {
        throw new BadRequestException("You are already a member of this workspace");
    }

    const role = await RoleModel.findOne({ name: RolesEnum.MEMBER });
    if (!role) {
        throw new NotFoundException("Member role not found");
    }

    const newMember = new MemberModel({
        userId: userId,
        workspaceId: workspace._id,
        role: role._id,
        joinedAt: new Date(),
    });

    await newMember.save();

    return { workspaceId: workspace._id, role: role.name };
};

export const sendInviteEmailService = async (workspaceId: string, targetEmail: string) => {
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException("Workspace not found");

    const frontendUrl = process.env.FRONTEND_ORIGIN;
    const inviteLink = `${frontendUrl}/invite/workspace/${workspace.inviteCode}/join`;

    const subject = `Invitation to join workspace: ${workspace.name}`;
    const html = `
    <p>You have been invited to join the workspace <b>${workspace.name}</b>.</p>
    <p>Click <a href="${inviteLink}">here</a> to join.</p>
  `;

    await sendEmail(targetEmail, subject, html);

    return { message: "Invitation email sent successfully" };
};

