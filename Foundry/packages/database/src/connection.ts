import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import type { DatabaseInstance, Queryable } from "./pglite-adapter";
import { createSqliteConnection } from "./sqlite-adapter";

let pool: Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

let instance: DatabaseInstance | null = null;

function createSupabaseConnection(connectionString?: string): {
  db: NodePgDatabase<typeof schema>;
  pool: Queryable;
  pgPool: Pool;
} {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required. Set the DATABASE_URL environment variable " +
        "or pass a connection string to createConnection(). " +
        "Get your connection string from Supabase Dashboard → Settings → Database."
    );
  }

  const pgPool = new Pool({ connectionString: url, max: 20 });
  const drizzleDb = drizzle(pgPool, { schema });

  pool = pgPool;
  db = drizzleDb;

  return {
    db: drizzleDb,
    pool: pgPool as unknown as Queryable,
    pgPool,
  };
}

export async function createConnection(
  backend?: string,
  connString?: string
): Promise<{ db: NodePgDatabase<typeof schema> | null; pool: Queryable }> {
  const resolved = backend ?? process.env.DATABASE_BACKEND ?? "supabase";

  if (resolved === "pglite" || resolved === "sqlite") {
    const dataDir = process.env.PGLITE_DATA_DIR || process.env.SQLITE_DATA_DIR;
    const inst = await createSqliteConnection(dataDir);
    instance = inst;
    db = null;
    pool = null;
    return { db: null, pool: inst.pool };
  }

  const { db: drizzleDb, pool: queryable } = createSupabaseConnection(connString);
  return { db: drizzleDb, pool: queryable };
}

export function getPool(): Pool {
  if (instance?.backend === "pglite" || instance?.backend === "sqlite") {
    throw new Error(
      "getPool() is not available with local backend. Use getQueryable() instead."
    );
  }
  if (!pool) throw new Error("Database not initialized. Call createConnection() first.");
  return pool;
}

export function getQueryable(): Queryable {
  if (instance?.backend === "pglite" || instance?.backend === "sqlite") {
    return instance.pool;
  }
  if (!pool) throw new Error("Database not initialized. Call createConnection() first.");
  return pool as unknown as Queryable;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!db) throw new Error("Database not initialized. Call createConnection() first.");
  return db;
}

export function getBackend(): "supabase" | "pglite" | "sqlite" {
  return instance?.backend ?? "supabase";
}

export async function closeConnection(): Promise<void> {
  if (instance) {
    await instance.close();
    instance = null;
    pool = null;
    db = null;
    return;
  }
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export type { DatabaseInstance, Queryable } from "./pglite-adapter";
