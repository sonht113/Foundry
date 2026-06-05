import type { ITagRepository } from "../repositories/tag.repository";
import type { Tag } from "@foundry/shared";
import { ValidationError } from "../errors";

export interface TagServiceDeps {
  tagRepo: ITagRepository;
}

export function createTagService(deps: TagServiceDeps) {
  async function list(): Promise<Tag[]> {
    return deps.tagRepo.list();
  }

  async function getById(id: string): Promise<Tag> {
    return deps.tagRepo.getById(id);
  }

  async function create(name: string): Promise<Tag> {
    if (!name || name.trim().length === 0) {
      throw new ValidationError("Tag name is required");
    }
    return deps.tagRepo.create(name);
  }

  async function remove(id: string): Promise<void> {
    return deps.tagRepo.delete(id);
  }

  return { list, getById, create, remove };
}

export type TagService = ReturnType<typeof createTagService>;
