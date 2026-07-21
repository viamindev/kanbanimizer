import { Router } from "express";
import { requirePermission } from "@/middleware/permissions.middleware";
import * as sectionsController from "./sections.controller";
import { loadSection, requireSectionAccess } from "@/middleware/section.middleware";

const sectionRouter = Router({ mergeParams: true });

sectionRouter.post(
  '/',
  requirePermission("section:create"),
  sectionsController.createSectionHandler
)

sectionRouter.get(
  '/:sectionId',
  loadSection,
  requireSectionAccess,
  requirePermission('section:read'),
  sectionsController.getSectionByIdHandler
)

sectionRouter.get(
  '/',
  requirePermission('section:read'),
  sectionsController.getAllowedProjectSectionsHandler
)

// sectionRouter.patch(
//   "/:sectionId",
//   requirePermission("section:update"),
//   // sectionsController.updateSectionHandler
// )

sectionRouter.delete(
  "/:sectionId",
  loadSection,
  requireSectionAccess,
  requirePermission("section:delete"),
  sectionsController.deleteSectionHandler
)

export default sectionRouter;
