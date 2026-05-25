import { Router } from "express";
import { sendInviteEmailController } from "../controllers/member.controller";

const inviteRoutes = Router();

inviteRoutes.post("/:workspaceId/invite", sendInviteEmailController);

export default inviteRoutes;