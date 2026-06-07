import { ipcMain } from "electron";

import { getMcpConfig } from "@/main/mcp/path-resolver";

export function registerMcpHandlers(): void {
  ipcMain.handle("mcp:getConfig", async () => {
    return getMcpConfig();
  });
}
