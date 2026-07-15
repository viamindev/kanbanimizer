import { type Request, type Response } from "express";
import { createProject, getProjectById, getProjectsByUserId, updateProject, deleteProject, getAssignedUsersInProject } from "./projects.service";
import { CreateProjectSchema, UpdateProjectSchema } from "./projects.schema";
import { BadRequestError, NotFoundError, UnauthorizedError } from "@/utils/errors";

export async function createProjectHandler(req: Request, res: Response) {
  if(!req.user) throw new UnauthorizedError();
  const { name, description } = CreateProjectSchema.parse(req.body);
  const ownerId = req.user.id;
  const project = await createProject({ name,description,ownerId });
  return res
    .status(201)
    .json({ message: "Project created successfully", data: project })
}

export async function getAssignedUsersInProjectHandler(req: Request<{projectId: string}>, res: Response) {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError();

  const projectId = req.params.projectId;
  if (!projectId) throw new BadRequestError();

  const assignedUsers = await getAssignedUsersInProject(projectId);

  return res
    .status(200)
    .json({message: "Assigned users: ", data: assignedUsers})

}

export async function getProjectsByUserIdHandler(req: Request, res: Response) {
  if(!req.user?.id) throw new UnauthorizedError();
  const userId = req.user?.id;
  const projects = await getProjectsByUserId(userId);
  return res
    .status(200)
    .json({ message: "Projects retrieved successfully", data: projects })
}

export async function getProjectByIdHandler(req: Request<{ projectId: string }>, res: Response) {
  if (!req.user?.id) throw new UnauthorizedError();
  const userId = req.user?.id;

  const projectId = req.params.projectId;
  if (!projectId) throw new BadRequestError();

  const project = await getProjectById(projectId, userId);
  if (!project) throw new NotFoundError();

  return res
    .status(200)
    .json({ message: "Project retrieved successfully", data: project })
}

export async function updateProjectHandler(req: Request<{ id: string }>, res: Response) {
  if (!req.user?.id) throw new UnauthorizedError();
  const userId = req.user.id;
  const projectId = req.params.id;
  if (!projectId) throw new BadRequestError();
  const { name, description } = UpdateProjectSchema.parse(req.body);
  const newProject = { name, description };
  if (!name && !description) throw new BadRequestError();
  const updatedProject = await updateProject(projectId, newProject, userId);
  return res
    .status(200)
    .json({ message: "Project updated successfully", data: updatedProject })
}

export async function deleteProjectHandler(req: Request<{ id: string }>, res: Response) {
  if (!req.user?.id) throw new UnauthorizedError();
  const userId = req.user.id;
  const projectId = req.params.id;
  if (!projectId) throw new NotFoundError();

  const deletedProject = await deleteProject(projectId, userId);
  if (!deletedProject) throw new NotFoundError();

  return res
    .status(200)
    .json({ message: "Project removed successfully" })
}
