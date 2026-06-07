import { existsSync, readFileSync, writeFileSync } from "fs";
import { connect } from "net";
import path from "path";

import { app, ipcMain } from "electron";

export interface DatabaseConfig {
  backend: "supabase" | "pglite";
  databaseUrl?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

interface AppConfig {
  database: DatabaseConfig;
}

function getConfigPath(): string {
  return path.join(app.getPath("userData"), "config.json");
}

export function loadConfig(): AppConfig {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) {
    return { database: { backend: "supabase" } };
  }
  try {
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return { database: { backend: "supabase" } };
  }
}

export function saveConfig(config: AppConfig): void {
  const configPath = getConfigPath();
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function registerConfigHandlers(): void {
  ipcMain.handle("config:get", async () => {
    return loadConfig();
  });

  ipcMain.handle("config:setDatabase", async (_event, db: DatabaseConfig) => {
    const config = loadConfig();
    config.database = db;
    saveConfig(config);
    applyDatabaseConfig(db);
    return { success: true };
  });

  ipcMain.handle("config:testConnection", async (_event, databaseUrl: string) => {
    try {
      const match = databaseUrl.match(/@([^:/]+)(?::(\d+))?/);
      const host = match?.[1] ?? "localhost";
      const port = parseInt(match?.[2] ?? "5432", 10);

      await new Promise<void>((resolve, reject) => {
        const sock = connect({ host, port, timeout: 5000 }, () => {
          sock.destroy();
          resolve();
        });
        sock.on("error", (err) => {
          sock.destroy();
          reject(err);
        });
      });
      return { success: true };
    } catch (err) {
      const message = (err as Error).message;
      return { success: false, error: message };
    }
  });
}

export function applyDatabaseConfig(db: DatabaseConfig): void {
  process.env.DATABASE_BACKEND = db.backend;
  if (db.databaseUrl) process.env.DATABASE_URL = db.databaseUrl;
  if (db.supabaseUrl) process.env.SUPABASE_URL = db.supabaseUrl;
  if (db.supabaseKey) process.env.SUPABASE_ANON_KEY = db.supabaseKey;
}
