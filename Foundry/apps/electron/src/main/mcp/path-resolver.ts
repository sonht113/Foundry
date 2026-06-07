import path from "path";

import { app } from "electron";

export interface McpConfig {
  serverPath: string;
  dataDir: string;
  nodePath: string;
  command: string[];
  environment: Record<string, string>;
}

export function getMcpConfig(): McpConfig {
  if (app.isPackaged) {
    const resourcesPath = process.resourcesPath!;
    const serverPath = path.join(resourcesPath, "mcp-server", "server.js");
    const dataDir = path.join(app.getPath("userData"), "pglite-data");
    const nodePath = path.join(resourcesPath, "app", "node_modules");

    return {
      serverPath,
      dataDir,
      nodePath,
      command: ["node", serverPath, "--backend", "pglite"],
      environment: {
        PGLITE_DATA_DIR: dataDir,
        NODE_PATH: nodePath,
      },
    };
  }

  const serverPath = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "mcp-server",
    "dist",
    "server.js"
  );
  const dataDir = path.resolve(__dirname, "..", "..", "..", "..", "..", ".pglite");

  return {
    serverPath,
    dataDir,
    nodePath: "",
    command: ["node", serverPath, "--backend", "pglite"],
    environment: {
      PGLITE_DATA_DIR: dataDir,
    },
  };
}
