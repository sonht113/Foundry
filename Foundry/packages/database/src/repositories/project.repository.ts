import type { IProjectRepository, CreateProjectInput, UpdateProjectInput, TaskCount } from "@foundry/domain";
import type { Project } from "@foundry/shared";
import { generateId } from "@foundry/shared";
import { NotFoundError, ValidationError } from "@foundry/domain";
import type { Queryable } from "../connection";

interface ProjectRow {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

function mapRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export class ProjectRepository implements IProjectRepository {
  constructor(private pool: Queryable) {}

  private now(): string {
    return new Date().toISOString();
  }

  async list(includeArchived = false): Promise<Project[]> {
    if (includeArchived) {
      const { rows } = await this.pool.query<ProjectRow>(
        "SELECT * FROM projects ORDER BY created_at DESC"
      );
      return rows.map(mapRow);
    }
    const { rows } = await this.pool.query<ProjectRow>(
      "SELECT * FROM projects WHERE archived_at IS NULL ORDER BY created_at DESC"
    );
    return rows.map(mapRow);
  }

  async getById(id: string): Promise<Project> {
    const { rows } = await this.pool.query<ProjectRow>(
      "SELECT * FROM projects WHERE id = $1",
      [id]
    );
    if (rows.length === 0) throw new NotFoundError("Project", id);
    return mapRow(rows[0]);
  }

  async create(input: CreateProjectInput): Promise<Project> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError("Project name is required");
    }
    if (input.name.length > 100) {
      throw new ValidationError("Project name must be 100 characters or less");
    }

    const id = generateId.project();
    const timestamp = this.now();

    await this.pool.query(
      "INSERT INTO projects (id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
      [id, input.name.trim(), (input.description ?? "").trim(), timestamp, timestamp]
    );

    await this.pool.query(
      "INSERT INTO columns (id, project_id, name, sort_order, color) VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ($11, $12, $13, $14, $15), ($16, $17, $18, $19, $20)",
      [
        generateId.column(), id, "Todo", 1, "zinc",
        generateId.column(), id, "Doing", 2, "blue",
        generateId.column(), id, "Review", 3, "amber",
        generateId.column(), id, "Done", 4, "emerald",
      ]
    );

    return this.getById(id);
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    const existing = await this.getById(id);
    const name = input.name?.trim() ?? existing.name;
    const description = input.description?.trim() ?? existing.description;

    if (name.length === 0) throw new ValidationError("Project name is required");
    if (name.length > 100) throw new ValidationError("Project name must be 100 characters or less");

    await this.pool.query(
      "UPDATE projects SET name = $1, description = $2, updated_at = $3 WHERE id = $4",
      [name, description, this.now(), id]
    );

    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.pool.query("DELETE FROM projects WHERE id = $1", [id]);
  }

  async archive(id: string): Promise<Project> {
    const existing = await this.getById(id);
    if (existing.archivedAt) throw new ValidationError("Project is already archived");

    const timestamp = this.now();
    await this.pool.query(
      "UPDATE projects SET archived_at = $1, updated_at = $2 WHERE id = $3",
      [timestamp, timestamp, id]
    );
    return this.getById(id);
  }

  async unarchive(id: string): Promise<Project> {
    const existing = await this.getById(id);
    if (!existing.archivedAt) throw new ValidationError("Project is not archived");

    await this.pool.query(
      "UPDATE projects SET archived_at = NULL, updated_at = $1 WHERE id = $2",
      [this.now(), id]
    );
    return this.getById(id);
  }

  async getTaskCount(id: string): Promise<TaskCount> {
    const { rows } = await this.pool.query<{ status: string; count: string }>(
      "SELECT status, COUNT(*) as count FROM tasks WHERE project_id = $1 GROUP BY status",
      [id]
    );

    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      const count = parseInt(row.count, 10);
      byStatus[row.status] = count;
      total += count;
    }
    return { total, byStatus };
  }
}
