import { readFileSync, statSync, writeFileSync } from "fs";
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
  reload(): void;
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

const WRITE_COMMANDS = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "REPLACE"];
const STRUCTURE_COMMANDS = ["CREATE TABLE", "CREATE INDEX", "CREATE VIEW", "CREATE TRIGGER"];

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createSqliteConnection(dataDir?: string): Promise<DatabaseInstance> {
  const SQL = await initSqlJs();

  const resolvedDataDir = expandEnvPath(dataDir || getDefaultDataDir());
  console.log(`[Foundry DB] SQLITE_DATA_DIR env: ${process.env.SQLITE_DATA_DIR ?? "(not set)"}`);
  console.log(`[Foundry DB] Resolved path: ${resolvedDataDir}`);

  let db: SqlJsDatabase = null!;
  let fromFile = false;
  let lastLoadTime = 0;

  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 100;
  let readErr: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const buffer = readFileSync(resolvedDataDir);
      if (buffer.length === 0) {
        throw new Error("Empty database file");
      }
      db = new SQL.Database(buffer);
      fromFile = true;
      console.log(`[Foundry DB] Loaded from file (attempt ${attempt + 1})`);
      break;
    } catch (err) {
      readErr = err as Error;
      if (attempt < MAX_RETRIES - 1) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }

  if (!fromFile) {
    console.warn(`[Foundry DB] Failed to read file after ${MAX_RETRIES} retries:`, readErr?.message);
    const dir = path.dirname(resolvedDataDir);
    try {
      const { mkdirSync } = await import("fs");
      mkdirSync(dir, { recursive: true });
    } catch {
      // ignore if dir already exists
    }
    db = new SQL.Database();
  }

  lastLoadTime = Date.now();

  db.run("PRAGMA journal_mode=WAL");
  db.run("PRAGMA foreign_keys=ON");

  db.run(CREATE_TABLES_SQL);

  function checkAndReload(): void {
    if (!resolvedDataDir) return;
    try {
      const stats = statSync(resolvedDataDir);
      if (stats.mtimeMs <= lastLoadTime) return;
      const buffer = readFileSync(resolvedDataDir);
      if (buffer.length === 0) return;
      db.close();
      db = new SQL.Database(buffer);
      db.run("PRAGMA journal_mode=WAL");
      db.run("PRAGMA foreign_keys=ON");
      lastLoadTime = stats.mtimeMs;
      console.log("[Foundry DB] Auto-reloaded from file (external change detected)");
    } catch {
      // best-effort; if reload fails, keep using current DB
    }
  }

  function reload(): void {
    if (!resolvedDataDir) return;
    const buffer = readFileSync(resolvedDataDir);
    if (buffer.length === 0) return;
    db.close();
    db = new SQL.Database(buffer);
    db.run("PRAGMA journal_mode=WAL");
    db.run("PRAGMA foreign_keys=ON");
    lastLoadTime = Date.now();
    console.log("[Foundry DB] Force-reloaded from file");
  }

  function maybeSave(sql: string) {
    if (!resolvedDataDir) return;
    const upperSql = sql.trim().toUpperCase();
    const isStructure = STRUCTURE_COMMANDS.some((cmd) => upperSql.startsWith(cmd));
    if (isStructure) return;
    const isWrite = WRITE_COMMANDS.some((cmd) => upperSql.startsWith(cmd));
    if (isWrite) {
      try {
        const data = db.export();
        writeFileSync(resolvedDataDir, Buffer.from(data));
        lastLoadTime = Date.now();
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
    return { rows };
  }

  function createClient(): QueryClient {
    let inTransaction = false;

    return {
      query: async <T = unknown>(sql: string, params?: unknown[]) => {
        checkAndReload();
        const upperSql = sql.trim().toUpperCase();
        if (upperSql === "BEGIN" || upperSql.startsWith("BEGIN ")) {
          inTransaction = true;
        }
        const result = query<T>(sql, params);
        if (!inTransaction) {
          maybeSave(sql);
        }
        if (upperSql === "COMMIT" || upperSql.startsWith("COMMIT ") || upperSql === "ROLLBACK" || upperSql.startsWith("ROLLBACK ")) {
          inTransaction = false;
          if (resolvedDataDir) {
            try {
              const data = db.export();
              writeFileSync(resolvedDataDir, Buffer.from(data));
              lastLoadTime = Date.now();
            } catch {
              // best-effort save
            }
          }
        }
        return result;
      },
      release: () => {
        inTransaction = false;
      },
    };
  }

  const pool: Queryable = {
    query<T>(sql: string, params?: unknown[]) {
      checkAndReload();
      const result = query<T>(sql, params);
      maybeSave(sql);
      return Promise.resolve(result);
    },
    connect: async () => createClient(),
  };

  return {
    pool,
    close: async () => {
      try {
        const data = db.export();
        writeFileSync(resolvedDataDir, Buffer.from(data));
        lastLoadTime = Date.now();
      } catch {
        // best-effort save
      }
      db.close();
    },
    reload,
  };
}
