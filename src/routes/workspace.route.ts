import { Router } from 'express';
import { createWorkspaceController } from '../controllers/workspace.controller';

const workspaceRoutes = Router();

workspaceRoutes.post('/', createWorkspaceController);

export default workspaceRoutes;
