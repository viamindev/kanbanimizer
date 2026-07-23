import { Router } from "express";
import { requirePermission } from "@/middleware/permissions.middleware";
import * as sectionsController from "./sections.controller";
import { loadSection, requireSectionAccess, requireSectionPermission } from "@/middleware/section.middleware";

const sectionRouter = Router({ mergeParams: true });

sectionRouter.post(
  '/',
  requirePermission("section:create"),
  sectionsController.createSectionHandler
)

sectionRouter.post(
  "/:sectionId/members",
  loadSection,
  requireSectionAccess,
  requirePermission("section:member:add"),
  sectionsController.addSectionMemberByEmailHandler
)

sectionRouter.get(
  "/:sectionId/members",
  loadSection,
  requireSectionAccess,
  requirePermission("section:member:read"),
  sectionsController.getSectionMembersHandler
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

sectionRouter.patch(
  "/:sectionId",
  loadSection,
  requireSectionAccess,
  requireSectionPermission("section:update"),
  sectionsController.updateSectionHandler
)

sectionRouter.delete(
  "/:sectionId",
  loadSection,
  requireSectionAccess,
  requireSectionPermission("section:delete"),
  sectionsController.deleteSectionHandler
)

export default sectionRouter;
