import { migrate as drizzleMigrate } from "drizzle-orm/node-postgres/migrator";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import path from "path";
import { getBackend } from "./connection";

export async function migrate(db: NodePgDatabase<Record<string, unknown>> | null): Promise<void> {
  const backend = getBackend();

  if (backend === "pglite" || backend === "sqlite") {
    console.error("[DB] Local backend detected (" + backend + ") — tables created by adapter, skipping migration");
    return;
  }

  if (!db) {
    throw new Error("Database instance required for Supabase migrations");
  }

  const migrationsFolder = path.join(__dirname, "..", "drizzle");
  await drizzleMigrate(db, { migrationsFolder });
  console.error("[DB] Drizzle migrations applied");
}

export { migrate as drizzleRunMigrations };
