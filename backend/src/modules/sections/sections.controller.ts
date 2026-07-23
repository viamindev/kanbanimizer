import { BadRequestError, NotFoundError, UnauthorizedError } from "@/utils/errors"
import type { Request, Response } from "express"
import { CreateSectionSchema, UpdateSectionSchema } from "./sections.schema"
import { createSection, getAllowedProjectSections, deleteSection, updateSection, addSectionMemberByEmail } from "./sections.service"
import { AddSectionMemberSchema } from "../members/members.schema"


export async function createSectionHandler(
  req: Request<{ projectId: string }>,
  res: Response,
) {
  const userId = req.user?.id
  if (!userId) throw new UnauthorizedError();

  const input = CreateSectionSchema.parse(req.body);

  const section = await createSection({
    projectId: req.params.projectId,
    createdByUserId: userId,
    name: input.name,
    accessScope: input.accessScope,
    description: input.description
  })

  return res.status(201).json({
    message: "Section created successfully: ",
    data: section
  })
}

export async function getSectionByIdHandler(
  req: Request<{
    projectId: string;
    sectionId: string;
  }>,
  res: Response,
) {
  const section = req.section;

  if (!section) {
    throw new NotFoundError("Section not found");
  }

  return res.status(200).json({
    message: "Section retrieved successfully",
    data: section,
  });
}

export async function getAllowedProjectSectionsHandler(req: Request<{ projectId: string }>, res: Response) {
  const userId = req.user?.id
  if (!userId) throw new UnauthorizedError();

  const projectId = req.params.projectId;

  const sections = await getAllowedProjectSections({ projectId, userId });

  return res.status(200).json({
    message: "Your sections in projects: ",
    data: sections || []
  })
}

export async function deleteSectionHandler(req: Request<{ projectId: string }>, res: Response) {
  const userId = req.user?.id
  if (!userId) throw new UnauthorizedError();

  const projectId = req.params.projectId;
  const sectionId = req.section?.id;
  if (!sectionId) throw new NotFoundError('That section not found');

  const deletedSection = await deleteSection({ projectId, sectionId });

  if (!deletedSection) {
    throw new NotFoundError("Section not found");
  }

  return res.status(200).json({
    message: "Your section successfully deleted: ",
    data: deletedSection
  })
}

export async function updateSectionHandler(req: Request<{ projectId: string; sectionId: string }>, res: Response) {
  const section = req.section;
  if (!section) throw new NotFoundError('Section not found');

  const input = UpdateSectionSchema.parse(req.body);

  const updatedSection = await updateSection({
     projectId: req.params.projectId,
     sectionId: section.id,
     input,
   });

  if (!updatedSection) throw new NotFoundError('Section not found');

  return res.status(200).json({ message: `Section ${section.id} successfully updated: `, data: updatedSection})
}

export async function addSectionMemberByEmailHandler(req: Request<{ projectId: string; sectionId: string }>, res: Response) {
  const userId = req.user?.id;
  const section = req.section;

  if (!userId) throw new UnauthorizedError();
  if (!section) throw new NotFoundError("Section not found");
  if (section.accessScope !== "restricted") throw new BadRequestError("Acces can only be granted to restricted sections");

  const { email } = AddSectionMemberSchema.parse(req.body);

  const member = await addSectionMemberByEmail({
    projectId: req.params.projectId,
    sectionId: section.id,
    grantedByUserId: userId,
    email
  });

  return res.status(201).json({
    message: "Section access granted successfully",
    data: member
  })

}
