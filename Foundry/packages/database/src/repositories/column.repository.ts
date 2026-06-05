import type { Pool } from "pg";
import type { IColumnRepository, CreateColumnInput, UpdateColumnInput } from "@foundry/domain";
import type { Column } from "@foundry/shared";
import { generateId } from "@foundry/shared";
import { NotFoundError, ValidationError } from "@foundry/domain";

interface ColumnRow {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  color: string;
}

function mapRow(row: ColumnRow): Column {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    sortOrder: row.sort_order,
    color: row.color,
  };
}

const DEFAULT_COLUMNS = [
  { name: "Todo", color: "zinc" },
  { name: "Doing", color: "blue" },
  { name: "Review", color: "amber" },
  { name: "Done", color: "emerald" },
];

export class ColumnRepository implements IColumnRepository {
  constructor(private pool: Pool) {}

  async list(projectId: string): Promise<Column[]> {
    const { rows } = await this.pool.query<ColumnRow>(
      "SELECT * FROM columns WHERE project_id = $1 ORDER BY sort_order ASC",
      [projectId]
    );

    if (rows.length === 0) {
      const { rows: projRows } = await this.pool.query(
        "SELECT 1 FROM projects WHERE id = $1",
        [projectId]
      );
      if (projRows.length > 0) return this.seedDefaults(projectId);
    }

    return rows.map(mapRow);
  }

  async getById(id: string): Promise<Column> {
    const { rows } = await this.pool.query<ColumnRow>(
      "SELECT * FROM columns WHERE id = $1",
      [id]
    );
    if (rows.length === 0) throw new NotFoundError("Column", id);
    return mapRow(rows[0]);
  }

  async create(input: CreateColumnInput): Promise<Column> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError("Column name is required");
    }

    const id = generateId.column();
    const color = input.color ?? "zinc";

    const { rows } = await this.pool.query<{ max: number | null }>(
      "SELECT MAX(sort_order) as max FROM columns WHERE project_id = $1",
      [input.projectId]
    );

    const sortOrder = (rows[0]?.max ?? 0) + 1;

    await this.pool.query(
      "INSERT INTO columns (id, project_id, name, sort_order, color) VALUES ($1, $2, $3, $4, $5)",
      [id, input.projectId, input.name.trim(), sortOrder, color]
    );

    return this.getById(id);
  }

  async update(id: string, input: UpdateColumnInput): Promise<Column> {
    const existing = await this.getById(id);
    const newName = input.name?.trim() ?? existing.name;
    const newColor = input.color ?? existing.color;

    if (!newName) throw new ValidationError("Column name is required");

    await this.pool.query(
      "UPDATE columns SET name = $1, color = $2 WHERE id = $3",
      [newName, newColor, id]
    );
    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);

    const { rows: fallbackRows } = await this.pool.query<{ id: string }>(
      "SELECT id FROM columns WHERE project_id = $1 AND id != $2 ORDER BY sort_order ASC LIMIT 1",
      [existing.projectId, id]
    );

    if (fallbackRows.length > 0) {
      await this.pool.query(
        "UPDATE tasks SET status = $1 WHERE status = $2 AND project_id = $3",
        [fallbackRows[0].id, existing.id, existing.projectId]
      );
    }

    await this.pool.query("DELETE FROM columns WHERE id = $1", [id]);
  }

  async reorder(projectId: string, columnIds: string[]): Promise<Column[]> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      for (let i = 0; i < columnIds.length; i++) {
        await client.query(
          "UPDATE columns SET sort_order = $1 WHERE id = $2 AND project_id = $3",
          [i + 1, columnIds[i], projectId]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
    return this.list(projectId);
  }

  async seedDefaults(projectId: string): Promise<Column[]> {
    const { rows } = await this.pool.query<ColumnRow>(
      "SELECT * FROM columns WHERE project_id = $1",
      [projectId]
    );

    if (rows.length > 0) return rows.map(mapRow);

    const values: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    DEFAULT_COLUMNS.forEach((def, i) => {
      values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4})`);
      params.push(generateId.column(), projectId, def.name, i + 1, def.color);
      paramIdx += 5;
    });

    await this.pool.query(
      `INSERT INTO columns (id, project_id, name, sort_order, color) VALUES ${values.join(", ")}`,
      params
    );

    return this.list(projectId);
  }
}
