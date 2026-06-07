import type { ITaskRepository, CreateTaskInput, UpdateTaskInput, SearchTasksInput } from "@foundry/domain";
import type { Task, Tag } from "@foundry/shared";
import { generateId } from "@foundry/shared";
import { NotFoundError, ValidationError } from "@foundry/domain";
import type { Queryable } from "../connection";

interface TaskRow {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
  estimate_hours: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority as Task["priority"],
    assignee: row.assignee,
    sortOrder: row.sort_order,
    startDate: row.start_date,
    endDate: row.end_date,
    estimateHours: row.estimate_hours,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const VALID_PRIORITIES = ["low", "medium", "high", "critical"];

export class TaskRepository implements ITaskRepository {
  constructor(private pool: Queryable) {}

  private now(): string {
    return new Date().toISOString();
  }

  async list(projectId?: string): Promise<Task[]> {
    if (projectId) {
      const { rows } = await this.pool.query<TaskRow>(
        "SELECT * FROM tasks WHERE project_id = $1 ORDER BY sort_order ASC",
        [projectId]
      );
      return rows.map(mapRow);
    }
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    );
    return rows.map(mapRow);
  }

  async getById(id: string): Promise<Task> {
    const { rows } = await this.pool.query<TaskRow>(
      "SELECT * FROM tasks WHERE id = $1",
      [id]
    );
    if (rows.length === 0) throw new NotFoundError("Task", id);
    return mapRow(rows[0]);
  }

  async create(input: CreateTaskInput): Promise<Task> {
    if (!input.title || input.title.trim().length === 0) {
      throw new ValidationError("Task title is required");
    }

    let status = input.status;
    if (!status) {
      const { rows: colRows } = await this.pool.query<{ id: string }>(
        "SELECT id FROM columns WHERE project_id = $1 ORDER BY sort_order ASC LIMIT 1",
        [input.projectId]
      );
      status = colRows[0]?.id ?? "todo";
    }
    const priority = input.priority ?? "medium";

    if (!VALID_PRIORITIES.includes(priority)) {
      throw new ValidationError(`Invalid priority: ${priority}`);
    }

    const id = generateId.task();
    const timestamp = this.now();

    const { rows: sortRows } = await this.pool.query<{ max: number | null }>(
      "SELECT MAX(sort_order) as max FROM tasks WHERE project_id = $1",
      [input.projectId]
    );

    const sortOrder = (sortRows[0]?.max ?? 0) + 1;

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO tasks (id, project_id, title, description, status, priority, assignee, start_date, end_date, estimate_hours, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          id, input.projectId, input.title.trim(), (input.description ?? "").trim(),
          status, priority, (input.assignee ?? "").trim(),
          input.startDate ?? null, input.endDate ?? null, input.estimateHours ?? 0,
          sortOrder, timestamp, timestamp,
        ]
      );

      if (input.tags && input.tags.length > 0) {
        for (const tagId of input.tags) {
          await client.query(
            "INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [id, tagId]
          );
        }
      }

      await client.query(
        "INSERT INTO task_history (id, task_id, field, old_value, new_value, changed_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [generateId.history(), id, "created", null, input.title.trim(), "human", timestamp]
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return this.getById(id);
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const existing = await this.getById(id);
    const timestamp = this.now();
    const historyInserts: Array<{
      hid: string;
      field: string;
      oldVal: string | null;
      newVal: string;
    }> = [];

    const newTitle = input.title?.trim() ?? existing.title;
    const newDescription = input.description?.trim() ?? existing.description;
    const newStatus = input.status ?? existing.status;
    const newPriority = input.priority ?? existing.priority;
    const newAssignee = input.assignee?.trim() ?? existing.assignee;
    const newStartDate = input.startDate !== undefined ? input.startDate : existing.startDate;
    const newEndDate = input.endDate !== undefined ? input.endDate : existing.endDate;
    const newEstimateHours = input.estimateHours ?? existing.estimateHours;

    if (input.title !== undefined && newTitle !== existing.title) {
      if (newTitle.length === 0) throw new ValidationError("Task title is required");
      historyInserts.push({ hid: generateId.history(), field: "title", oldVal: existing.title, newVal: newTitle });
    }

    if (input.status !== undefined && newStatus !== existing.status) {
      historyInserts.push({ hid: generateId.history(), field: "status", oldVal: existing.status, newVal: newStatus });
    }

    if (input.priority !== undefined && newPriority !== existing.priority) {
      if (!VALID_PRIORITIES.includes(newPriority)) {
        throw new ValidationError(`Invalid priority: ${newPriority}`);
      }
      historyInserts.push({ hid: generateId.history(), field: "priority", oldVal: existing.priority, newVal: newPriority });
    }

    if (input.assignee !== undefined && newAssignee !== existing.assignee) {
      historyInserts.push({ hid: generateId.history(), field: "assignee", oldVal: existing.assignee || null, newVal: newAssignee || "" });
    }

    if (input.description !== undefined && newDescription !== existing.description) {
      historyInserts.push({ hid: generateId.history(), field: "description", oldVal: existing.description || null, newVal: newDescription || "" });
    }

    if (input.startDate !== undefined && newStartDate !== existing.startDate) {
      historyInserts.push({ hid: generateId.history(), field: "startDate", oldVal: existing.startDate, newVal: newStartDate ?? "" });
    }

    if (input.endDate !== undefined && newEndDate !== existing.endDate) {
      historyInserts.push({ hid: generateId.history(), field: "endDate", oldVal: existing.endDate, newVal: newEndDate ?? "" });
    }

    if (input.estimateHours !== undefined && newEstimateHours !== existing.estimateHours) {
      historyInserts.push({ hid: generateId.history(), field: "estimateHours", oldVal: String(existing.estimateHours), newVal: String(newEstimateHours) });
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, assignee = $5, start_date = $6, end_date = $7, estimate_hours = $8, updated_at = $9
         WHERE id = $10`,
        [newTitle, newDescription, newStatus, newPriority, newAssignee, newStartDate, newEndDate, newEstimateHours, timestamp, id]
      );

      for (const h of historyInserts) {
        await client.query(
          "INSERT INTO task_history (id, task_id, field, old_value, new_value, changed_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [h.hid, id, h.field, h.oldVal, h.newVal, "human", timestamp]
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  }

  async move(id: string, newStatus: string): Promise<Task> {
    const existing = await this.getById(id);
    if (existing.status === newStatus) return existing;

    const timestamp = this.now();

    await this.pool.query(
      "UPDATE tasks SET status = $1, updated_at = $2 WHERE id = $3",
      [newStatus, timestamp, id]
    );

    await this.pool.query(
      "INSERT INTO task_history (id, task_id, field, old_value, new_value, changed_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [generateId.history(), id, "status", existing.status, newStatus, "human", timestamp]
    );

    return this.getById(id);
  }

  async search(input: SearchTasksInput): Promise<Task[]> {
    const limit = input.limit ?? 50;
    const query = `%${input.query}%`;

    const params: unknown[] = [query, query];
    let paramIdx = 3;

    let sql = "SELECT * FROM tasks WHERE (title ILIKE $1 OR description ILIKE $2)";

    if (input.projectId) {
      sql += ` AND project_id = $${paramIdx}`;
      params.push(input.projectId);
      paramIdx++;
    }
    if (input.status) {
      sql += ` AND status = $${paramIdx}`;
      params.push(input.status);
      paramIdx++;
    }
    if (input.priority) {
      sql += ` AND priority = $${paramIdx}`;
      params.push(input.priority);
      paramIdx++;
    }

    sql += ` ORDER BY updated_at DESC LIMIT $${paramIdx}`;
    params.push(limit);

    const { rows } = await this.pool.query<TaskRow>(sql, params);
    return rows.map(mapRow);
  }

  async getTags(taskId: string): Promise<Tag[]> {
    const { rows } = await this.pool.query<{ id: string; name: string }>(
      `SELECT t.id, t.name FROM tags t
       INNER JOIN task_tags tt ON tt.tag_id = t.id
       WHERE tt.task_id = $1`,
      [taskId]
    );
    return rows;
  }

  async addTag(taskId: string, tagId: string): Promise<void> {
    await this.getById(taskId);
    await this.pool.query(
      "INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [taskId, tagId]
    );
  }

  async removeTag(taskId: string, tagId: string): Promise<void> {
    await this.pool.query(
      "DELETE FROM task_tags WHERE task_id = $1 AND tag_id = $2",
      [taskId, tagId]
    );
  }

  async getHistory(taskId: string): Promise<unknown[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM task_history WHERE task_id = $1 ORDER BY created_at DESC",
      [taskId]
    );
    return rows;
  }
}
