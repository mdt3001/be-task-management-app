import { Router } from 'express';
import { changeWorkspaceMemberRoleController, createWorkspaceController, deleteWorkspaceController, getAllWorkspacesController, getWorkspaceAnalyticsController, getWorkspaceByIdController, getWorkspaceMembersController, leaveWorkspaceController, updateWorkspaceByIdController,  } from '../controllers/workspace.controller';

const workspaceRoutes = Router();

workspaceRoutes.post('/', createWorkspaceController);
workspaceRoutes.get('/', getAllWorkspacesController);
workspaceRoutes.get('/:id', getWorkspaceByIdController);
workspaceRoutes.get('/members/:id', getWorkspaceMembersController);
workspaceRoutes.get('/analytics/:id', getWorkspaceAnalyticsController);
workspaceRoutes.put('/change-member-role/:id', changeWorkspaceMemberRoleController);
workspaceRoutes.put('/:id', updateWorkspaceByIdController);
workspaceRoutes.delete('/:id/leave', leaveWorkspaceController);
workspaceRoutes.delete('/:id', deleteWorkspaceController);

export default workspaceRoutes;
