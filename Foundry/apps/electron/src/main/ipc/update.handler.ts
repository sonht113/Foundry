import { app, BrowserWindow, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";

let updateChecking = false;

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
    sendToAll("update:checking");
  });

  autoUpdater.on("update-available", (info) => {
    sendToAll("update:available", {
      version: info.version,
      releaseNotes:
        typeof info.releaseNotes === "string"
          ? info.releaseNotes
          : Array.isArray(info.releaseNotes)
            ? info.releaseNotes.map((r) => r.note ?? "").join("\n")
            : undefined,
    });
  });

  autoUpdater.on("update-not-available", () => {
    sendToAll("update:not-available");
  });

  autoUpdater.on("download-progress", (progress) => {
    sendToAll("update:downloading", { percent: progress.percent });
  });

  autoUpdater.on("update-downloaded", () => {
    sendToAll("update:downloaded");
  });

  autoUpdater.on("error", (err) => {
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
}
