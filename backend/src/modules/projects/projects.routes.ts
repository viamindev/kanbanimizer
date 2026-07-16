import { requireAuth } from "@/middleware/auth.middleware"
import { requireMembership } from "@/middleware/membership.middleware"
import { requirePermission } from "@/middleware/permissions.middleware"
import sectionsRouter from "@/modules/sections/sections.routes"
import { Router } from 'express'
import * as projectsController from './projects.controller'

const router = Router();

router.post('/',
  requireAuth,
  projectsController.createProjectHandler);

router.get('/',
  requireAuth,
  projectsController.getProjectsByUserIdHandler);

router.get('/:projectId/members',
  requireAuth,
  requireMembership("projectId"),
  requirePermission("member:read"),
  projectsController.getProjectMembersByIdHandler);

router.get('/:projectId',
  requireAuth,
  requireMembership("projectId"),
  requirePermission("project:read"),
  projectsController.getProjectByIdHandler);

router.patch('/:projectId',
  requireAuth,
  requireMembership("projectId"),
  requirePermission("project:update"),
  projectsController.updateProjectHandler);

router.delete('/:projectId',
  requireAuth,
  requireMembership("projectId"),
  requirePermission("project:delete"),
  projectsController.deleteProjectHandler);

router.use("/:projectId/sections",
  requireAuth,
  requireMembership("projectId"),
  sectionsRouter);


export default router;
