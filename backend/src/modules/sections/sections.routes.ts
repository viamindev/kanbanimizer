import { Router } from "express";
import { requirePermission } from "@/middleware/permissions.middleware";
import * as sectionsController from "./sections.controller";

const sectionRouter = Router({ mergeParams: true });

sectionRouter.post(
  '/',
  requirePermission("section:create"),
  sectionsController.createSectionHandler
)

sectionRouter.get(
  '/',
  requirePermission("section:read"),
  sectionsController.getSectionsHandler
  )

sectionRouter.get(
  '/:sectionId',
  requirePermission('section:read'),
  // sectionsController.getSectionByIdHandler
)

sectionRouter.patch(
  "/:sectionId",
  requirePermission("section:update"),
  // sectionsController.updateSectionHandler
)

sectionRouter.delete(
  "/:sectionId",
  requirePermission("section:delete"),
  // sectionsController.deleteSectionHandler
)

export default sectionRouter;
