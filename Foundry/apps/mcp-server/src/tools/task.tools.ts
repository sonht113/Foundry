import { z } from "zod";

export function registerTaskTools(server: any, taskService: any) {
  server.registerTool(
    "list_tasks",
    {
      description: "List tasks. Optionally filter by project.",
      inputSchema: {
        projectId: z.string().optional().describe("Filter by project ID"),
      },
    },
    async ({ projectId }: { projectId?: string }) => {
      const tasks = await taskService.list(projectId);
      if (tasks.length === 0) {
        return { content: [{ type: "text" as const, text: "No tasks found." }] };
      }
      const grouped: Record<string, string[]> = {};
      for (const t of tasks) {
        const key = t.status || "todo";
        if (!grouped[key]) grouped[key] = [];
        let line = `  [${t.id}] ${t.title} (${t.priority})`;
        if (t.endDate) {
          const dueLabel = new Date(t.endDate).getTime() < new Date().setHours(0, 0, 0, 0) && t.status !== "done"
            ? "OVERDUE"
            : t.endDate.slice(0, 10);
          line += ` | Due: ${dueLabel}`;
        }
        grouped[key].push(line);
      }
      const lines: string[] = [];
      for (const [status, items] of Object.entries(grouped)) {
        if (items.length > 0) {
          lines.push(`\n## ${status} (${items.length})`);
          lines.push(...items);
        }
      }
      return {
        content: [{ type: "text" as const, text: `Tasks:${lines.join("\n")}` }],
      };
    }
  );

  server.registerTool(
    "get_task",
    {
      description: "Get full task details by ID, including tags.",
      inputSchema: { id: z.string().describe("Task ID (e.g. task_xxx)") },
    },
    async ({ id }: { id: string }) => {
      const task = await taskService.getById(id);
      const tags = await taskService.getTags(id);
      const tagsStr = tags.length > 0 ? `\n  Tags: ${tags.map((t: any) => t.name).join(", ")}` : "";
      const dueStr = task.endDate ? `\n  Due: ${task.endDate}` : "";
      return {
        content: [
          {
            type: "text" as const,
            text:
              `[${task.id}] ${task.title}\n` +
              `  Status: ${task.status} | Priority: ${task.priority} | Assignee: ${task.assignee || "unassigned"}\n` +
              `  Created: ${task.createdAt} | Updated: ${task.updatedAt}` +
              dueStr +
              tagsStr +
              (task.description ? `\n  Description: ${task.description}` : ""),
          },
        ],
      };
    }
  );

  server.registerTool(
    "create_task",
    {
      description: "Create a new task.",
      inputSchema: {
        projectId: z.string().describe("Project ID to add the task to"),
        title: z.string().min(1).describe("Task title"),
        description: z.string().optional().describe("Task description (markdown supported)"),
        status: z.string().optional().describe("Status column ID"),
        priority: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
        assignee: z.string().optional().describe("Who is working on this task"),
        startDate: z
          .string()
          .nullable()
          .optional()
          .describe("ISO start date (e.g. 2026-06-01T00:00:00.000Z)"),
        endDate: z.string().nullable().optional().describe("ISO end date / deadline"),
        estimateHours: z.number().min(0).optional().describe("Estimated effort in hours"),
        tags: z.array(z.string()).optional().describe("Tag IDs to attach"),
      },
    },
    async ({
      projectId,
      title,
      description,
      status,
      priority,
      assignee,
      startDate,
      endDate,
      estimateHours,
      tags,
    }: {
      projectId: string;
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      assignee?: string;
      startDate?: string | null;
      endDate?: string | null;
      estimateHours?: number;
      tags?: string[];
    }) => {
      const task = await taskService.create({
        projectId,
        title,
        description,
        status,
        priority,
        assignee,
        startDate,
        endDate,
        estimateHours,
        tags,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Task created: ${task.title} (ID: ${task.id})\nStatus: ${task.status} | Priority: ${task.priority}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "update_task",
    {
      description: "Update a task.",
      inputSchema: {
        id: z.string().describe("Task ID to update"),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional().describe("Status column ID"),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        assignee: z.string().optional(),
        startDate: z.string().nullable().optional().describe("ISO start date"),
        endDate: z.string().nullable().optional().describe("ISO end date / deadline"),
        estimateHours: z.number().min(0).optional().describe("Estimated effort in hours"),
      },
    },
    async (args: any) => {
      const { id, ...data } = args;
      const task = await taskService.update(id, data);
      return {
        content: [
          {
            type: "text" as const,
            text: `Task updated: ${task.title} (ID: ${task.id})\nStatus: ${task.status} | Priority: ${task.priority}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "delete_task",
    {
      description: "Delete a task.",
      inputSchema: { id: z.string().describe("Task ID to delete") },
    },
    async ({ id }: { id: string }) => {
      const task = await taskService.getById(id);
      await taskService.remove(id);
      return {
        content: [{ type: "text" as const, text: `Task deleted: ${task.title} (ID: ${id})` }],
      };
    }
  );

  server.registerTool(
    "move_task",
    {
      description: "Move a task to a different status column.",
      inputSchema: {
        id: z.string().describe("Task ID"),
        status: z.string().describe("Target status column ID"),
      },
    },
    async ({ id, status }: { id: string; status: string }) => {
      const task = await taskService.move(id, status);
      return {
        content: [
          {
            type: "text" as const,
            text: `Task moved: "${task.title}" → ${status}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "search_tasks",
    {
      description: "Search tasks by title or description.",
      inputSchema: {
        query: z.string().min(1).describe("Search query"),
        projectId: z.string().optional().describe("Limit search to a project"),
        status: z.string().optional().describe("Filter by status column ID"),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        overdue: z.boolean().optional().describe("Only return overdue tasks (past end_date, not done)"),
        limit: z.number().optional().default(20),
      },
    },
    async ({
      query,
      projectId,
      status,
      priority,
      overdue,
      limit,
    }: {
      query: string;
      projectId?: string;
      status?: string;
      priority?: string;
      overdue?: boolean;
      limit?: number;
    }) => {
      const tasks = await taskService.search({ query, projectId, status, priority, overdue, limit });
      if (tasks.length === 0) {
        const desc = overdue ? ` overdue` : "";
        return { content: [{ type: "text" as const, text: `No${desc} tasks found for "${query}".` }] };
      }
      const formatted = tasks
        .map((t: any) => `[${t.id}] ${t.title} (${t.status}/${t.priority}${t.endDate ? " | due: " + t.endDate : ""})`)
        .join("\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${tasks.length} task(s) for "${query}":\n${formatted}`,
          },
        ],
      };
    }
  );
}
