import * as authMiddleware from "@/middleware/auth.middleware";
import * as projectsController from './projects.controller';
import { Router } from 'express';

const router = Router();

router.post('/', authMiddleware.requireAuth, projectsController.createProjectHandler);
router.get('/', authMiddleware.requireAuth, projectsController.getProjectsByUserIdHandler);
router.get('/:id', authMiddleware.requireAuth, projectsController.getProjectByIdHandler);
router.patch('/:id', authMiddleware.requireAuth, projectsController.updateProjectHandler);
router.delete('/:id', authMiddleware.requireAuth, projectsController.deleteProjectHandler);


export default router;
