import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

export function createConnection(connectionString?: string): {
  pool: Pool;
  db: NodePgDatabase<typeof schema>;
} {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required. Set the DATABASE_URL environment variable " +
        "or pass a connection string to createConnection(). " +
        "Get your connection string from Supabase Dashboard → Settings → Database."
    );
  }

  pool = new Pool({ connectionString: url, max: 20 });
  db = drizzle(pool, { schema });

  return { pool, db };
}

export function getPool(): Pool {
  if (!pool) throw new Error("Database not initialized. Call createConnection() first.");
  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!db) throw new Error("Database not initialized. Call createConnection() first.");
  return db;
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export type DatabaseInstance = ReturnType<typeof createConnection>;
