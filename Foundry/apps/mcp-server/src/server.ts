#!/usr/bin/env node

import path from "path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";

import { createConnection, getQueryable, migrate } from "@foundry/database";
import { ProjectRepository, ColumnRepository, TaskRepository, TagRepository, NoteRepository } from "@foundry/database";
import { createProjectService, createColumnService, createTaskService, createTagService, createNoteService } from "@foundry/domain";

import { registerAITools } from "./tools/ai.tools";
import { registerColumnTools } from "./tools/column.tools";
import { registerNoteTools } from "./tools/note.tools";
import { registerProjectTools } from "./tools/project.tools";
import { registerTagTools } from "./tools/tag.tools";
import { registerTaskTools } from "./tools/task.tools";

dotenv.config();

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
    console.error("  Or switch to PGlite: DATABASE_BACKEND=pglite");
    process.exit(1);
  }

  const { db, pool } = await createConnection(backend, dbUrl);
  await migrate(db);

  const projectRepo = new ProjectRepository(pool);
  const columnRepo = new ColumnRepository(pool);
  const taskRepo = new TaskRepository(pool);
  const tagRepo = new TagRepository(pool);
  const noteRepo = new NoteRepository(pool);

  const projectService = createProjectService({ projectRepo });
  const columnService = createColumnService({ columnRepo });
  const taskService = createTaskService({ taskRepo });
  const tagService = createTagService({ tagRepo });
  const noteService = createNoteService({ noteRepo });

  const server = new McpServer(
    {
      name: "foundry-mcp",
      version: "0.2.0",
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
  registerAITools(server, projectService, taskService);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[Foundry MCP] Connected via stdio. Backend: ${backend}`);
}

main().catch((err) => {
  console.error("[Foundry MCP] Fatal error:", err);
  process.exit(1);
});
