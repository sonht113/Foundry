import { z } from "zod";

export function registerNoteTools(server: any, noteService: any) {
  server.registerTool(
    "list_notes",
    {
      description: "List all notes for a task.",
      inputSchema: { taskId: z.string().describe("Task ID") },
    },
    async ({ taskId }: { taskId: string }) => {
      const notes = await noteService.list(taskId);
      if (notes.length === 0) {
        return { content: [{ type: "text" as const, text: "No notes for this task." }] };
      }
      const formatted = notes
        .map((n: any) => `[${n.id}] ${new Date(n.created_at).toLocaleString()}\n${n.content}`)
        .join("\n\n---\n\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Notes for task ${taskId}:\n\n${formatted}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "create_note",
    {
      description: "Add a note to a task.",
      inputSchema: {
        taskId: z.string().describe("Task ID"),
        content: z.string().min(1).describe("Note content (markdown supported)"),
      },
    },
    async ({ taskId, content }: { taskId: string; content: string }) => {
      const note = await noteService.create(taskId, content);
      return {
        content: [
          {
            type: "text" as const,
            text: `Note added to task ${taskId} (Note ID: ${note.id})`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "update_note",
    {
      description: "Update a note's content.",
      inputSchema: {
        id: z.string().describe("Note ID"),
        content: z.string().min(1).describe("New note content"),
      },
    },
    async ({ id, content }: { id: string; content: string }) => {
      const note = await noteService.update(id, content);
      return {
        content: [
          {
            type: "text" as const,
            text: `Note updated (ID: ${note.id})`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "delete_note",
    {
      description: "Delete a note.",
      inputSchema: { id: z.string().describe("Note ID to delete") },
    },
    async ({ id }: { id: string }) => {
      await noteService.remove(id);
      return {
        content: [{ type: "text" as const, text: `Note deleted (ID: ${id})` }],
      };
    }
  );
}
