import { readFileSync } from "fs";
import { join } from "path";

import { app, BrowserWindow, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";

let updateChecking = false;
let lastUpdateState: string = "idle";
let lastUpdateInfo: { version: string; releaseNotes?: string } | null = null;

function sendToAll(channel: string, ...args: unknown[]): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  });
}

export function initAutoUpdater(): void {
  if (!app.isPackaged) {
    console.log("[Foundry] Auto-update disabled in development");
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.allowPrerelease = false;

  autoUpdater.on("checking-for-update", () => {
    lastUpdateState = "checking";
    sendToAll("update:checking");
  });

  autoUpdater.on("update-available", (info) => {
    lastUpdateState = "available";
    lastUpdateInfo = {
      version: info.version,
      releaseNotes:
        typeof info.releaseNotes === "string"
          ? info.releaseNotes
          : Array.isArray(info.releaseNotes)
            ? info.releaseNotes.map((r) => r.note ?? "").join("\n")
            : undefined,
    };
    sendToAll("update:available", lastUpdateInfo);
  });

  autoUpdater.on("update-not-available", () => {
    lastUpdateState = "not-available";
    sendToAll("update:not-available");
  });

  autoUpdater.on("download-progress", (progress) => {
    lastUpdateState = "downloading";
    sendToAll("update:downloading", { percent: progress.percent });
  });

  autoUpdater.on("update-downloaded", () => {
    lastUpdateState = "downloaded";
    sendToAll("update:downloaded");
  });

  autoUpdater.on("error", (err) => {
    lastUpdateState = "error";
    console.error("[Foundry] Auto-update error:", err.message);
    sendToAll("update:error", { message: err.message });
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error("[Foundry] Auto-update check failed:", err.message);
    });
  }, 5000);
}

export function registerUpdateHandlers(): void {
  ipcMain.handle("update:check", async () => {
    if (updateChecking) return { success: false, reason: "already-checking" };
    updateChecking = true;
    try {
      const result = await autoUpdater.checkForUpdates();
      if (result?.cancellationToken?.cancelled) {
        return { success: false, reason: "cancelled" };
      }
      return {
        success: true,
        version: result?.updateInfo?.version,
      };
    } catch (err) {
      return { success: false, reason: (err as Error).message };
    } finally {
      updateChecking = false;
    }
  });

  ipcMain.handle("update:install", async () => {
    autoUpdater.quitAndInstall();
    return { success: true };
  });

  ipcMain.handle("update:getStatus", async () => {
    return {
      state: lastUpdateState,
      version: lastUpdateInfo?.version,
      releaseNotes: lastUpdateInfo?.releaseNotes,
    };
  });

  ipcMain.handle("app:getVersion", async () => {
    try {
      const pkg = JSON.parse(readFileSync(join(__dirname, "../../../package.json"), "utf-8"));
      return { version: pkg.version as string };
    } catch {
      return { version: app.getVersion() };
    }
  });
}
