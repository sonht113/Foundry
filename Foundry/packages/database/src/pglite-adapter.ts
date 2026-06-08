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
  backend: "supabase" | "sqlite";
  db: NodePgDatabase<typeof schema> | null;
  pool: Queryable;
  close(): Promise<void>;
}
