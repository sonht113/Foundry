import type { INoteRepository } from "@foundry/domain";
import type { Note } from "@foundry/shared";
import { generateId } from "@foundry/shared";
import { NotFoundError, ValidationError } from "@foundry/domain";
import type { Queryable } from "../connection";

interface NoteRow {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: NoteRow): Note {
  return {
    id: row.id,
    taskId: row.task_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class NoteRepository implements INoteRepository {
  constructor(private pool: Queryable) {}

  private now(): string {
    return new Date().toISOString();
  }

  async list(taskId: string): Promise<Note[]> {
    const { rows } = await this.pool.query<NoteRow>(
      "SELECT * FROM notes WHERE task_id = $1 ORDER BY created_at DESC",
      [taskId]
    );
    return rows.map(mapRow);
  }

  async getById(id: string): Promise<Note> {
    const { rows } = await this.pool.query<NoteRow>(
      "SELECT * FROM notes WHERE id = $1",
      [id]
    );
    if (rows.length === 0) throw new NotFoundError("Note", id);
    return mapRow(rows[0]);
  }

  async create(taskId: string, content: string): Promise<Note> {
    if (!content || content.trim().length === 0) {
      throw new ValidationError("Note content is required");
    }

    const id = generateId.note();
    const timestamp = this.now();

    await this.pool.query(
      "INSERT INTO notes (id, task_id, content, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
      [id, taskId, content.trim(), timestamp, timestamp]
    );

    return this.getById(id);
  }

  async update(id: string, content: string): Promise<Note> {
    await this.getById(id);
    if (!content || content.trim().length === 0) {
      throw new ValidationError("Note content is required");
    }

    const timestamp = this.now();
    await this.pool.query(
      "UPDATE notes SET content = $1, updated_at = $2 WHERE id = $3",
      [content.trim(), timestamp, id]
    );
    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.pool.query("DELETE FROM notes WHERE id = $1", [id]);
  }
}
