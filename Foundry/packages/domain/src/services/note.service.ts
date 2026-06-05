import type { INoteRepository } from "../repositories/note.repository";
import type { Note } from "@foundry/shared";
import { ValidationError } from "../errors";

export interface NoteServiceDeps {
  noteRepo: INoteRepository;
}

export function createNoteService(deps: NoteServiceDeps) {
  async function list(taskId: string): Promise<Note[]> {
    return deps.noteRepo.list(taskId);
  }

  async function getById(id: string): Promise<Note> {
    return deps.noteRepo.getById(id);
  }

  async function create(taskId: string, content: string): Promise<Note> {
    if (!content || content.trim().length === 0) {
      throw new ValidationError("Note content is required");
    }
    return deps.noteRepo.create(taskId, content);
  }

  async function update(id: string, content: string): Promise<Note> {
    if (!content || content.trim().length === 0) {
      throw new ValidationError("Note content is required");
    }
    return deps.noteRepo.update(id, content);
  }

  async function remove(id: string): Promise<void> {
    return deps.noteRepo.delete(id);
  }

  return { list, getById, create, update, remove };
}

export type NoteService = ReturnType<typeof createNoteService>;
