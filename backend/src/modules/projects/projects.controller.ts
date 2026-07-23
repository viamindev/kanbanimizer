import { BadRequestError, NotFoundError, UnauthorizedError } from "@/utils/errors"
import { type Request, type Response } from "express"
import { CreateProjectSchema, UpdateProjectSchema } from "./projects.schema"
import { createProject, deleteProject, getProjectById, getProjectMembersById, getAccessibleProjectsByUserId, updateProject, addProjectMemberByEmail } from "./projects.service"
import { AddProjectMemberSchema } from "../members/members.schema"

export async function createProjectHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError();

  const input = CreateProjectSchema.parse(req.body);
  const project = await createProject({ ownerUserId: userId, ...input });

  return res
    .status(201)
    .json({ message: "Project created successfully", data: project })
}

export async function getProjectMembersByIdHandler(req: Request<{projectId: string}>, res: Response) {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError();

  const projectId = req.params.projectId;
  if (!projectId) throw new BadRequestError();

  const assignedUsers = await getProjectMembersById(projectId);

  return res
    .status(200)
    .json({message: `Assigned users to ${projectId}: `, data: assignedUsers})

}

export async function getAccessibleProjectsByUserIdHandler(req: Request, res: Response) {
  const userId = req.user?.id;
  if(!userId) throw new UnauthorizedError();

  const projects = await getAccessibleProjectsByUserId(userId);

  return res
    .status(200)
    .json({ message: "Projects retrieved successfully: ", data: projects })
}

export async function getProjectByIdHandler(req: Request<{ projectId: string }>, res: Response) {
  const projectId = req.params.projectId;
  if (!projectId) throw new BadRequestError();

  const project = await getProjectById(projectId);
  if (!project) throw new NotFoundError();

  return res
    .status(200)
    .json({ message: "Project retrieved successfully: ", data: project })
}

export async function updateProjectHandler(req: Request<{ projectId: string }>, res: Response) {
  const projectId = req.params.projectId;
  if (!projectId) throw new NotFoundError();

  const { name, description } = UpdateProjectSchema.parse(req.body);

  const updatedProject = await updateProject(projectId, { name, description });
  if (!updatedProject) throw new NotFoundError();

  return res
    .status(200)
    .json({ message: "Project updated successfully: ", data: updatedProject })
}

export async function deleteProjectHandler(req: Request<{ projectId: string }>, res: Response) {
  const projectId = req.params.projectId;
  if (!projectId) throw new NotFoundError();

  const deletedProject = await deleteProject(projectId);
  if (!deletedProject) throw new NotFoundError();

  return res
    .status(200)
    .json({ message: "Project removed successfully: ", data: deletedProject })
}

export async function addProjectMemberByEmailHandler(req: Request<{ projectId: string }>, res: Response) {
  const projectId = req.params.projectId;
  if (!projectId) throw new NotFoundError();

  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError();

  const input = AddProjectMemberSchema.parse(req.body);
  const memberInvite = await addProjectMemberByEmail({ projectId, ownerUserId: userId, ...input });

  return res.status(201).json({message: `User ${input.email} successfully invited`, data: memberInvite})
}
