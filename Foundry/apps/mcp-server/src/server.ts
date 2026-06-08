#!/usr/bin/env node

import fs from "fs";
import path from "path";

function resolveBundledModules(): void {
  if (process.env.NODE_PATH) {
    module.paths.unshift(process.env.NODE_PATH);
  }

  const scriptDir = __dirname;
  if (scriptDir.includes("mcp-server") && scriptDir.includes("resources")) {
    const appNodeModules = path.resolve(scriptDir, "..", "app", "node_modules");
    if (fs.existsSync(appNodeModules)) {
      module.paths.unshift(appNodeModules);
    }
  }
}

resolveBundledModules();

async function main() {
  const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const { createConnection, migrate } = await import("@foundry/database");
  const {
    ProjectRepository,
    ColumnRepository,
    TaskRepository,
    TagRepository,
    NoteRepository,
    ConversationRepository,
  } = await import("@foundry/database");
  const {
    createProjectService,
    createColumnService,
    createTaskService,
    createTagService,
    createNoteService,
    createConversationService,
  } = await import("@foundry/domain");

  const { registerAITools } = await import("./tools/ai.tools");
  const { registerColumnTools } = await import("./tools/column.tools");
  const { registerNoteTools } = await import("./tools/note.tools");
  const { registerProjectTools } = await import("./tools/project.tools");
  const { registerTagTools } = await import("./tools/tag.tools");
  const { registerTaskTools } = await import("./tools/task.tools");
  const { registerConversationTools } = await import("./tools/conversation.tools");

  const { pool } = await createConnection();
  await migrate();

  const projectRepo = new ProjectRepository(pool);
  const columnRepo = new ColumnRepository(pool);
  const taskRepo = new TaskRepository(pool);
  const tagRepo = new TagRepository(pool);
  const noteRepo = new NoteRepository(pool);
  const conversationRepo = new ConversationRepository(pool);

  const projectService = createProjectService({ projectRepo });
  const columnService = createColumnService({ columnRepo });
  const taskService = createTaskService({ taskRepo });
  const tagService = createTagService({ tagRepo });
  const noteService = createNoteService({ noteRepo });
  const conversationService = createConversationService({ conversationRepo });

  const server = new McpServer(
    {
      name: "foundry-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  registerProjectTools(server, projectService);
  registerColumnTools(server, columnService);
  registerTaskTools(server, taskService);
  registerTagTools(server, tagService);
  registerNoteTools(server, noteService);
  registerConversationTools(server, conversationService);
  registerAITools(server, projectService, taskService);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[Foundry MCP] Connected via stdio. Backend: sqlite");
}

main().catch((err) => {
  console.error("[Foundry MCP] Fatal error:", err);
  process.exit(1);
});
