import type { DatabaseInstance, Queryable } from "./sqlite-adapter";
import { createSqliteConnection } from "./sqlite-adapter";

let instance: DatabaseInstance | null = null;

export async function createConnection(): Promise<{ pool: Queryable }> {
  const dataDir = process.env.SQLITE_DATA_DIR;
  const inst = await createSqliteConnection(dataDir || undefined);
  instance = inst;
  return { pool: inst.pool };
}

export function getQueryable(): Queryable {
  if (!instance) throw new Error("Database not initialized. Call createConnection() first.");
  return instance.pool;
}

export async function closeConnection(): Promise<void> {
  if (instance) {
    await instance.close();
    instance = null;
  }
}

export type { DatabaseInstance, Queryable } from "./sqlite-adapter";
