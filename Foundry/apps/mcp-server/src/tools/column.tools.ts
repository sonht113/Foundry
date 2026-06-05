import { z } from "zod";

export function registerColumnTools(server: any, columnService: any) {
  server.registerTool(
    "list_columns",
    {
      description: "List all columns for a project.",
      inputSchema: {
        projectId: z.string().describe("Project ID"),
      },
    },
    async ({ projectId }: { projectId: string }) => {
      const columns = await columnService.list(projectId);
      if (columns.length === 0) {
        return { content: [{ type: "text" as const, text: "No columns found." }] };
      }
      const lines = columns.map(
        (c: any) => `  [${c.id}] ${c.name} (color: ${c.color}, order: ${c.sort_order})`
      );
      return {
        content: [
          { type: "text" as const, text: `Columns (${columns.length}):\n${lines.join("\n")}` },
        ],
      };
    }
  );

  server.registerTool(
    "create_column",
    {
      description: "Create a new column in a project.",
      inputSchema: {
        projectId: z.string().describe("Project ID"),
        name: z.string().min(1).describe("Column name"),
        color: z
          .string()
          .optional()
          .describe("Tailwind color key (zinc, blue, amber, emerald, red, violet, teal, orange)"),
      },
    },
    async ({ projectId, name, color }: { projectId: string; name: string; color?: string }) => {
      const column = await columnService.create({ projectId, name, color });
      return {
        content: [
          {
            type: "text" as const,
            text: `Column created: "${column.name}" (ID: ${column.id})`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "delete_column",
    {
      description: "Delete a column. Tasks in this column are moved to the default column.",
      inputSchema: { id: z.string().describe("Column ID to delete") },
    },
    async ({ id }: { id: string }) => {
      const column = await columnService.getById(id);
      await columnService.remove(id);
      return {
        content: [
          {
            type: "text" as const,
            text: `Column deleted: "${column.name}" (ID: ${id})`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "reorder_columns",
    {
      description: "Reorder columns in a project.",
      inputSchema: {
        projectId: z.string().describe("Project ID"),
        columnIds: z.array(z.string()).describe("Ordered list of column IDs"),
      },
    },
    async ({ projectId, columnIds }: { projectId: string; columnIds: string[] }) => {
      const columns = await columnService.reorder(projectId, columnIds);
      const names = columns.map((c: any) => c.name).join(", ");
      return {
        content: [{ type: "text" as const, text: `Columns reordered: ${names}` }],
      };
    }
  );
}
