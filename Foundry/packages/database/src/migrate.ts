import { migrate as drizzleMigrate } from "drizzle-orm/node-postgres/migrator";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { getBackend, getQueryable } from "./connection";
import type { Queryable } from "./pglite-adapter";

export async function migrate(db: NodePgDatabase<Record<string, unknown>> | null): Promise<void> {
  const backend = getBackend();

  if (backend === "pglite") {
    console.error("[DB] PGlite backend detected — running raw SQL migrations");
    await runPGliteMigrations(getQueryable());
    return;
  }

  if (!db) {
    throw new Error("Database instance required for Supabase migrations");
  }

  const migrationsFolder = path.join(__dirname, "..", "drizzle");
  await drizzleMigrate(db, { migrationsFolder });
  console.error("[DB] Drizzle migrations applied");
}

async function runPGliteMigrations(pool: Queryable): Promise<void> {
  const drizzleDir = path.join(__dirname, "..", "drizzle");
  const entries = readdirSync(drizzleDir).filter(
    (f) => f.endsWith(".sql") && !f.startsWith("meta")
  );
  entries.sort();

  for (const file of entries) {
    const sql = readFileSync(path.join(drizzleDir, file), "utf-8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg.includes("already exists")) {
          continue;
        }
        console.error(`[DB] Migration ${file} statement failed:`, msg);
        throw err;
      }
    }
  }

  console.error("[DB] PGlite migrations applied from drizzle/ directory");
}

export { migrate as drizzleRunMigrations };
