import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import path from "path";

import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";

export interface QueryResult<T = unknown> {
  rows: T[];
}

export interface QueryClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  release(): void;
}

export interface Queryable {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  connect(): Promise<QueryClient>;
}

export interface DatabaseInstance {
  pool: Queryable;
  close(): Promise<void>;
}

function convertParams(sql: string, params?: unknown[]): { sql: string; params: unknown[] } {
  if (!params || params.length === 0) return { sql, params: [] };
  const expanded: unknown[] = [];
  const converted = sql.replace(/\$(\d+)/g, (_match, num) => {
    expanded.push(params[parseInt(num, 10) - 1]);
    return "?";
  });
  return { sql: converted, params: expanded };
}

const WRITE_COMMANDS = ["INSERT", "UPDATE", "DELETE", "CREATE", "DROP", "ALTER", "REPLACE"];

function getDefaultDataDir(): string {
  const platform = process.platform;
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(homedir(), "AppData", "Roaming");
    return path.join(appData, "Foundry", "foundry.db");
  }
  if (platform === "darwin") {
    return path.join(homedir(), "Library", "Application Support", "Foundry", "foundry.db");
  }
  return path.join(homedir(), ".local", "share", "Foundry", "foundry.db");
}

function expandEnvPath(p: string): string {
  let result = p;
  result = result.replace(/%APPDATA%/gi, process.env.APPDATA || path.join(homedir(), "AppData", "Roaming"));
  result = result.replace(/%LOCALAPPDATA%/gi, process.env.LOCALAPPDATA || path.join(homedir(), "AppData", "Local"));
  result = result.replace(/^~(?=[/\\])/, homedir());
  return result;
}

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS "projects" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  "archived_at" text
);

CREATE TABLE IF NOT EXISTS "columns" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  "name" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "color" text DEFAULT 'zinc' NOT NULL
);

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'todo' NOT NULL,
  "priority" text DEFAULT 'medium' NOT NULL,
  "assignee" text DEFAULT '' NOT NULL,
  "sort_order" real DEFAULT 0 NOT NULL,
  "start_date" text,
  "end_date" text,
  "estimate_hours" real DEFAULT 0 NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "tags" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "task_tags" (
  "task_id" text NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  "tag_id" text NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY ("task_id", "tag_id")
);

CREATE TABLE IF NOT EXISTS "notes" (
  "id" text PRIMARY KEY NOT NULL,
  "task_id" text NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  "content" text DEFAULT '' NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "task_history" (
  "id" text PRIMARY KEY NOT NULL,
  "task_id" text NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  "field" text NOT NULL,
  "old_value" text,
  "new_value" text,
  "changed_by" text DEFAULT 'human' NOT NULL,
  "created_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" text PRIMARY KEY NOT NULL,
  "task_id" text NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  "source" text NOT NULL,
  "author" text NOT NULL,
  "content" text NOT NULL,
  "external_id" text,
  "external_url" text,
  "created_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "settings" (
  "key" text PRIMARY KEY NOT NULL,
  "value" text NOT NULL
);
`;

export async function createSqliteConnection(dataDir?: string): Promise<DatabaseInstance> {
  const SQL = await initSqlJs();

  const resolvedDataDir = expandEnvPath(dataDir || getDefaultDataDir());

  let db: SqlJsDatabase;
  try {
    const buffer = readFileSync(resolvedDataDir);
    db = new SQL.Database(buffer);
  } catch {
    const dir = path.dirname(resolvedDataDir);
    try {
      const { mkdirSync } = await import("fs");
      mkdirSync(dir, { recursive: true });
    } catch {
      // ignore if dir already exists
    }
    db = new SQL.Database();
  }

  db.run("PRAGMA journal_mode=WAL");
  db.run("PRAGMA foreign_keys=ON");

  db.run(CREATE_TABLES_SQL);

  function maybeSave(sql: string) {
    if (!resolvedDataDir) return;
    const upperSql = sql.trim().toUpperCase();
    const isWrite = WRITE_COMMANDS.some((cmd) => upperSql.startsWith(cmd));
    if (isWrite) {
      try {
        const data = db.export();
        writeFileSync(resolvedDataDir, Buffer.from(data));
      } catch {
        // best-effort save
      }
    }
  }

  function query<T = unknown>(sql: string, params?: unknown[]): QueryResult<T> {
    const { sql: convertedSql, params: expandedParams } = convertParams(sql, params);
    const stmt = db.prepare(convertedSql);
    if (expandedParams.length > 0) {
      stmt.bind(expandedParams as any);
    }
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
    stmt.free();
    maybeSave(sql);
    return { rows };
  }

  const pool: Queryable = {
    query: async <T = unknown>(sql: string, params?: unknown[]) => query<T>(sql, params),
    connect: async (): Promise<QueryClient> => ({
      query: async <T = unknown>(sql: string, params?: unknown[]) => query<T>(sql, params),
      release: () => {},
    }),
  };

  return {
    pool,
    close: async () => {
      try {
        const data = db.export();
        writeFileSync(resolvedDataDir, Buffer.from(data));
      } catch {
        // best-effort save
      }
      db.close();
    },
  };
}
