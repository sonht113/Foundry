import type { ITaskRepository, CreateTaskInput, UpdateTaskInput, SearchTasksInput } from "../repositories/task.repository";
import type { Task, Tag } from "@foundry/shared";
import { ValidationError } from "../errors";

const VALID_PRIORITIES = ["low", "medium", "high", "critical"];

export interface TaskServiceDeps {
  taskRepo: ITaskRepository;
}

export function createTaskService(deps: TaskServiceDeps) {
  async function list(projectId?: string): Promise<Task[]> {
    return deps.taskRepo.list(projectId);
  }

  async function getById(id: string): Promise<Task> {
    return deps.taskRepo.getById(id);
  }

  async function create(input: CreateTaskInput): Promise<Task> {
    if (!input.title || input.title.trim().length === 0) {
      throw new ValidationError("Task title is required");
    }
    const priority = input.priority ?? "medium";
    if (!VALID_PRIORITIES.includes(priority)) {
      throw new ValidationError(`Invalid priority: ${priority}`);
    }
    return deps.taskRepo.create(input);
  }

  async function update(id: string, input: UpdateTaskInput): Promise<Task> {
    return deps.taskRepo.update(id, input);
  }

  async function remove(id: string): Promise<void> {
    return deps.taskRepo.delete(id);
  }

  async function move(id: string, newStatus: string): Promise<Task> {
    return deps.taskRepo.move(id, newStatus);
  }

  async function search(input: SearchTasksInput): Promise<Task[]> {
    return deps.taskRepo.search(input);
  }

  async function getTags(taskId: string): Promise<Tag[]> {
    return deps.taskRepo.getTags(taskId);
  }

  async function addTag(taskId: string, tagId: string): Promise<void> {
    return deps.taskRepo.addTag(taskId, tagId);
  }

  async function removeTag(taskId: string, tagId: string): Promise<void> {
    return deps.taskRepo.removeTag(taskId, tagId);
  }

  async function getHistory(taskId: string) {
    return deps.taskRepo.getHistory(taskId);
  }

  return { list, getById, create, update, remove, move, search, getTags, addTag, removeTag, getHistory };
}

export type TaskService = ReturnType<typeof createTaskService>;
