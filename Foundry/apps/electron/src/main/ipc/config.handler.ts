import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import { app, ipcMain } from "electron";

export interface DatabaseConfig {
  backend: "sqlite";
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
    return { database: { backend: "sqlite" } };
  }
  try {
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return { database: { backend: "sqlite" } };
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
    return { success: true, backend: "sqlite" };
  });
}
