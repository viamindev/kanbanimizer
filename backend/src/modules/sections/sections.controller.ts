import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/utils/errors";
import type { Request, Response } from "express";
import { CreateSectionSchema } from "./sections.schema";
import {createSection, getAllowedSectionsByProjectId, getAllowedSectionById } from "./sections.service"


export async function createSectionHandler(
  req: Request<{ projectId: string }>,
  res: Response,
) {
  const projectId = req.params.projectId;
  const userId = req.user?.id;


  if (!userId) {
    throw new UnauthorizedError();
  }

  const { name, description, visibility } = CreateSectionSchema.parse(req.body);

  const section = await createSection({
    projectId,
    createdBy: userId,
    name,
    description,
    visibility
  });

  return res.status(201).json({
    message: "Section created successfully",
    data: section
  })
}

export async function getSectionsHandler(
  req: Request<{ projectId: string }>,
  res: Response,
) {
  const projectId = req.params.projectId;
  const membership = req.membership;
  const userId = req.user?.id;


  if (!userId) throw new UnauthorizedError();
  if (!membership) throw new ForbiddenError();

  const sections = await getAllowedSectionsByProjectId({ projectId, userId, role: membership?.role });

  return res.status(200).json({
    message: "Section retrieved successfully",
    data: sections
  })
}

export async function getSectionByIdHandler(
  req: Request<{
    projectId: string;
    sectionId: string;
  }>,
  res: Response,
) {
  const membership = req.membership;
  const userId = req.user?.id;
  const projectId = req.params.projectId;
  const sectionId = req.params.sectionId;

  if (!userId) throw new UnauthorizedError();
  if (!membership) throw new ForbiddenError();

  const section = await getAllowedSectionById({
    projectId: projectId,
    sectionId: sectionId,
    userId,
    role: membership?.role
  })

  if (!section) throw new NotFoundError("Section not found");

  return res.status(200).json({
    message: "Section retrieved successfully",
    data: section
  })
}
