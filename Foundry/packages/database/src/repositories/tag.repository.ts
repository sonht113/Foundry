import type { Pool } from "pg";
import type { ITagRepository } from "@foundry/domain";
import type { Tag } from "@foundry/shared";
import { generateId } from "@foundry/shared";
import { NotFoundError, ValidationError } from "@foundry/domain";

interface TagRow {
  id: string;
  name: string;
}

function mapRow(row: TagRow): Tag {
  return { id: row.id, name: row.name };
}

export class TagRepository implements ITagRepository {
  constructor(private pool: Pool) {}

  async list(): Promise<Tag[]> {
    const { rows } = await this.pool.query<TagRow>(
      "SELECT * FROM tags ORDER BY name ASC"
    );
    return rows.map(mapRow);
  }

  async getById(id: string): Promise<Tag> {
    const { rows } = await this.pool.query<TagRow>(
      "SELECT * FROM tags WHERE id = $1",
      [id]
    );
    if (rows.length === 0) throw new NotFoundError("Tag", id);
    return mapRow(rows[0]);
  }

  async create(name: string): Promise<Tag> {
    if (!name || name.trim().length === 0) {
      throw new ValidationError("Tag name is required");
    }

    const trimmed = name.trim().toLowerCase();
    const { rows } = await this.pool.query<TagRow>(
      "SELECT * FROM tags WHERE name = $1",
      [trimmed]
    );
    if (rows.length > 0) return mapRow(rows[0]);

    const id = generateId.tag();
    await this.pool.query(
      "INSERT INTO tags (id, name) VALUES ($1, $2)",
      [id, trimmed]
    );
    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.pool.query("DELETE FROM tags WHERE id = $1", [id]);
  }
}
