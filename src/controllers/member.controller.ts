import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request, Response } from "express";
import { z } from "zod";
import { joinWorkspaceByInviteService, sendInviteEmailService } from "../services/member.service";
import { HTTPSTATUS } from "../config/http.config";

export const joinWorkspaceController = asyncHandler(
    async (req: Request, res: Response) => {
        const inviteCode = z.string().parse(req.params.inviteCode);
        const userId = req.user?._id;

        const { workspaceId, role } = await joinWorkspaceByInviteService(userId, inviteCode);

        return res.status(HTTPSTATUS.OK).json({
            message: "Successfully joined workspace",
            workspaceId,
            role
        });
    }
);

export const sendInviteEmailController = asyncHandler(
    async (req: Request, res: Response) => {
        const { workspaceId } = req.params;
        const { email } = req.body;

        if (!workspaceId || typeof workspaceId !== "string") {
            return res.status(400).json({ message: "Invalid workspaceId" });
        }

        if (!email || typeof email !== "string") {
            return res.status(400).json({ message: "Invalid email" });
        }

        const result = await sendInviteEmailService(workspaceId, email);

        return res.status(HTTPSTATUS.OK).json(result); // Dùng return để nhất quán
    }
);