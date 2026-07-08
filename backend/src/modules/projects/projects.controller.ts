import { type Request, type Response } from "express";
import { createProject, getProjectById, getProjectsByUserId, updateProject, deleteProject } from "./projects.service";
import { CreateProjectSchema } from "./projects.schema";
import { UnauthorizedError } from "@/utils/errors";

export async function createProjectHandler(req: Request, res: Response) {
  const { name, description } = CreateProjectSchema.parse(req.body);
  if(!req.userId) throw new UnauthorizedError();
  const ownerId = req.userId;
  const project = await createProject({ name,description,ownerId });
  return res
    .status(201)
    .json({ message: "Project created successfully", data: project })
}

export async function getProjectsByUserIdHandler(req: Request, res: Response) {
  if(!req.userId) throw new UnauthorizedError();
  const userId = req.userId;
  const projects = await getProjectsByUserId(userId);
  return res
    .status(200)
    .json({ message: "Projects retrieved successfully", data: projects })
}

export async function getProjectByIdHandler(req: Request<{ id: string }>, res: Response) {

  if (!req.userId) throw new UnauthorizedError();

  const projectId = req.params.id;
  if (!projectId) throw new Error("Project ID is required");

  const project = await getProjectById(projectId);
  if (!project) throw new Error("Project not found");

  return res
    .status(200)
    .json({ message: "Project retrieved successfully", data: project })
}

export async function updateProjectHandler(req: Request<{ id: string }>, res: Response) {
  if (!req.userId) throw new UnauthorizedError();
  const projectId = req.params.id;
  if (!projectId) throw new Error("Project ID is required");
  const { name, description } = req.body;
  const newProject = { name, description, ownerId: req.userId}
  if (!name && !description) throw new Error("Name or description is required");
  await updateProject(projectId, newProject);
  return res
    .status(200)
    .json({ message: "Project updated successfully" })
}

export async function deleteProjectHandler(req: Request<{ id: string }>, res: Response) {
  if (!req.userId) throw new UnauthorizedError();
  const projectId = req.params.id;
  if (!projectId) throw new Error("Project ID is required");
  await deleteProject(projectId);
  return res
    .status(200)
    .json({ message: "Project removed successfully" })
}
