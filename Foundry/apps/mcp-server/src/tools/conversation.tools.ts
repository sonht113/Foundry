import { z } from "zod";

export function registerConversationTools(server: any, conversationService: any) {
  server.registerTool(
    "list_conversations",
    {
      description: "List all conversations for a task.",
      inputSchema: { taskId: z.string().describe("Task ID") },
    },
    async ({ taskId }: { taskId: string }) => {
      const conversations = await conversationService.list(taskId);
      if (conversations.length === 0) {
        return { content: [{ type: "text" as const, text: "No conversations for this task." }] };
      }
      const formatted = conversations
        .map(
          (c: any) =>
            `[${c.source}] ${c.author} · ${new Date(c.createdAt).toLocaleString()}\n${c.content}${c.externalUrl ? `\n🔗 ${c.externalUrl}` : ""}`
        )
        .join("\n\n---\n\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `Conversations for task ${taskId}:\n\n${formatted}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "create_conversation",
    {
      description: "Add a conversation entry to a task (from external MCP tools like Jira, Backlog).",
      inputSchema: {
        taskId: z.string().describe("Task ID"),
        source: z.string().min(1).describe("Source platform (e.g. jira, backlog, manual)"),
        author: z.string().min(1).describe("Original comment author"),
        content: z.string().min(1).describe("Conversation content"),
        externalId: z.string().optional().describe("Comment ID in the external system"),
        externalUrl: z.string().optional().describe("URL to the original comment"),
        createdAt: z.string().optional().describe("Original timestamp (ISO format)"),
      },
    },
    async (args: {
      taskId: string;
      source: string;
      author: string;
      content: string;
      externalId?: string;
      externalUrl?: string;
      createdAt?: string;
    }) => {
      const conversation = await conversationService.create({
        taskId: args.taskId,
        source: args.source,
        author: args.author,
        content: args.content,
        externalId: args.externalId,
        externalUrl: args.externalUrl,
        createdAt: args.createdAt,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Conversation added to task ${args.taskId} (ID: ${conversation.id})`,
          },
        ],
      };
    }
  );
}
