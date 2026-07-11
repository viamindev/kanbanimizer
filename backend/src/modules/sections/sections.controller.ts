import { UnauthorizedError } from "@/utils/errors";
import type { Request, Response } from "express";
import { CreateSectionSchema } from "./sections.schema";
import {createSection } from "./sections.service"


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


// export async function getSectionsHandler(
//   req: Request<{ projectId: string }>,
//   res: Response,
// ) {
//   const projectId = req.params.projectId;
//   const userId = req.user?.id;

//   const sections = await getSectionsByProjectId({
//     projectId,
//     userId
//   });

//   return res.status(200).json({
//     message: "Section retrieved successfully",
//     data: sections
//   })
// }
