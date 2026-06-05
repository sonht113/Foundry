import { z } from "zod";

export function registerTagTools(server: any, tagService: any) {
  server.registerTool(
    "list_tags",
    {
      description: "List all available tags.",
    },
    async () => {
      const tags = await tagService.list();
      if (tags.length === 0) {
        return { content: [{ type: "text" as const, text: "No tags found." }] };
      }
      const formatted = tags.map((t: any) => `[${t.id}] ${t.name}`).join("\n");
      return { content: [{ type: "text" as const, text: `Tags:\n${formatted}` }] };
    }
  );

  server.registerTool(
    "create_tag",
    {
      description: "Create a new tag (case-insensitive, deduplicated).",
      inputSchema: { name: z.string().min(1).describe("Tag name") },
    },
    async ({ name }: { name: string }) => {
      const tag = await tagService.create(name);
      return {
        content: [
          {
            type: "text" as const,
            text: `Tag created: ${tag.name} (ID: ${tag.id})`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "delete_tag",
    {
      description: "Delete a tag.",
      inputSchema: { id: z.string().describe("Tag ID to delete") },
    },
    async ({ id }: { id: string }) => {
      const tag = await tagService.getById(id);
      await tagService.remove(id);
      return {
        content: [{ type: "text" as const, text: `Tag deleted: ${tag.name}` }],
      };
    }
  );
}
