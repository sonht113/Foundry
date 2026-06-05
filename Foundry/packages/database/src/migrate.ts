import { migrate as drizzleMigrate } from "drizzle-orm/node-postgres/migrator";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function migrate(db: NodePgDatabase<any>): Promise<void> {
  const migrationsFolder = path.join(__dirname, "..", "drizzle");
  await drizzleMigrate(db, { migrationsFolder });
  console.error("[DB] Drizzle migrations applied");
}

export { migrate as drizzleRunMigrations };
