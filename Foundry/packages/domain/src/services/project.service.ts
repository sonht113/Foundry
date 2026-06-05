import type { IProjectRepository, CreateProjectInput, UpdateProjectInput } from "../repositories/project.repository";
import type { Project } from "@foundry/shared";
import { ValidationError } from "../errors";

export interface ProjectServiceDeps {
  projectRepo: IProjectRepository;
}

export function createProjectService(deps: ProjectServiceDeps) {
  async function list(includeArchived = false): Promise<Project[]> {
    return deps.projectRepo.list(includeArchived);
  }

  async function getById(id: string): Promise<Project> {
    return deps.projectRepo.getById(id);
  }

  async function create(input: CreateProjectInput): Promise<Project> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError("Project name is required");
    }
    if (input.name.length > 100) {
      throw new ValidationError("Project name must be 100 characters or less");
    }
    return deps.projectRepo.create(input);
  }

  async function update(id: string, input: UpdateProjectInput): Promise<Project> {
    return deps.projectRepo.update(id, input);
  }

  async function remove(id: string): Promise<void> {
    return deps.projectRepo.delete(id);
  }

  async function archive(id: string): Promise<Project> {
    return deps.projectRepo.archive(id);
  }

  async function unarchive(id: string): Promise<Project> {
    return deps.projectRepo.unarchive(id);
  }

  async function getTaskCount(id: string) {
    return deps.projectRepo.getTaskCount(id);
  }

  return { list, getById, create, update, remove, archive, unarchive, getTaskCount };
}

export type ProjectService = ReturnType<typeof createProjectService>;
