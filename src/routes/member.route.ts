import { Router } from "express";
import { joinWorkspaceController, sendInviteEmailController } from "../controllers/member.controller";

const memberRoutes = Router();


memberRoutes.post("/workspace/:inviteCode/join", joinWorkspaceController);

export default memberRoutes;