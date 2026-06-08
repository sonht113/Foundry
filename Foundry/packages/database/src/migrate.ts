import { migrate as drizzleMigrate } from "drizzle-orm/node-postgres/migrator";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import path from "path";
import { getBackend } from "./connection";

export async function migrate(db: NodePgDatabase<Record<string, unknown>> | null): Promise<void> {
  const backend = getBackend();

  if (backend !== "supabase") {
    console.error("[DB] Local backend detected (" + backend + ") — tables created by adapter, skipping migration");
    return;
  }

  if (!db) {
    throw new Error("Database instance required for Supabase migrations");
  }

  const migrationsFolder = path.join(__dirname, "..", "drizzle");
  try {
    await drizzleMigrate(db, { migrationsFolder });
    console.error("[DB] Drizzle migrations applied");
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("already exists")) {
      console.error("[DB] Migration skipped — objects already exist:", msg);
    } else {
      throw err;
    }
  }
}

export { migrate as drizzleRunMigrations };
