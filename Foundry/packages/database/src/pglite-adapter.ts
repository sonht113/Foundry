import { PGlite } from "@electric-sql/pglite";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "./schema";

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
  backend: "supabase" | "pglite";
  db: NodePgDatabase<typeof schema> | null;
  pool: Queryable;
  close(): Promise<void>;
}

class PGliteClient implements QueryClient {
  private pglite: PGlite;
  private txDepth = 0;

  constructor(pglite: PGlite) {
    this.pglite = pglite;
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>> {
    const trimmed = sql.trim().toUpperCase();

    if (trimmed === "BEGIN" || trimmed === "BEGIN TRANSACTION" || trimmed === "BEGIN;") {
      this.txDepth++;
      return { rows: [] as unknown as T[] };
    }

    if (trimmed === "COMMIT" || trimmed === "COMMIT;") {
      this.txDepth--;
      return { rows: [] as unknown as T[] };
    }

    if (trimmed === "ROLLBACK" || trimmed === "ROLLBACK;") {
      this.txDepth--;
      return { rows: [] as unknown as T[] };
    }

    const result = await this.pglite.query(sql, params);
    return { rows: result.rows as T[] };
  }

  release(): void {}
}

export async function createPGliteConnection(
  dataDir?: string
): Promise<DatabaseInstance> {
  const client = new PGlite(dataDir ? { dataDir } : undefined);

  const pool: Queryable = {
    query: async <T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>> => {
      const result = await client.query(sql, params);
      return { rows: result.rows as T[] };
    },

    connect: async (): Promise<QueryClient> => {
      return new PGliteClient(client);
    },
  };

  const db = null;

  return {
    backend: "pglite",
    db,
    pool,
    close: async () => {
      await client.close();
    },
  };
}
