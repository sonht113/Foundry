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

function loadDotenv(): void {
  const envPaths = [
    path.resolve(__dirname, "..", "..", "..", "..", ".env"),
    path.resolve(__dirname, "..", "..", ".env"),
  ];
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const rawValue = trimmed.slice(eq + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadDotenv();

function parseArgs(): { dbUrl?: string; backend?: string } {
  const args = process.argv.slice(2);
  const result: { dbUrl?: string; backend?: string } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--db-url" && i + 1 < args.length) {
      result.dbUrl = args[i + 1];
      i++;
    } else if (args[i] === "--backend" && i + 1 < args.length) {
      result.backend = args[i + 1];
      i++;
    }
  }
  return result;
}

async function main() {
  const args = parseArgs();
  const backend = args.backend ?? process.env.DATABASE_BACKEND ?? "supabase";
  const dbUrl = args.dbUrl ?? process.env.DATABASE_URL;

  if (backend === "supabase" && !dbUrl) {
    console.error("[Foundry MCP] Error: DATABASE_URL is required for Supabase backend.");
    console.error("  Set DATABASE_URL environment variable or pass --db-url <url>");
    console.error("  Get your connection string from Supabase Dashboard → Settings → Database.");
    console.error("  Or switch to SQLite: DATABASE_BACKEND=sqlite");
    process.exit(1);
  }

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

  const { db, pool } = await createConnection(backend, dbUrl);
  await migrate(db);

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

  console.error(`[Foundry MCP] Connected via stdio. Backend: ${backend}`);
}

main().catch((err) => {
  console.error("[Foundry MCP] Fatal error:", err);
  process.exit(1);
});
