# Auto-Update Plan — electron-updater + GitHub Releases

> Target version: `v0.3.0`

## Tổng quan

Sử dụng [`electron-updater`](https://www.electron.build/auto-update) với GitHub Releases provider. Flow:

```
Push tag v0.3.0 → CI build → upload artifacts lên GitHub Release
    → app đang chạy detect bản mới → thông báo trong app
    → user click "Restart & Install" → app tự động tải + cài + restart
```

File mới: **1** (`update.handler.ts`)  
File sửa: **10**

---

## Step 1: Package dependency

**File:** `Foundry/apps/electron/package.json`

Thêm vào `dependencies`:
```json
"electron-updater": "^6.0.0"
```

Chạy `pnpm install` sau khi thêm.

---

## Step 2: electron-builder.yml — publish config

**File:** `Foundry/apps/electron/electron-builder.yml`

Thêm vào cuối file:
```yaml
publish:
  provider: github
  releaseType: release
```

Artifact naming mặc định của electron-builder (với GitHub provider) sẽ tự động đặt tên file theo format `{productName}-{version}-{platform}-{arch}.{ext}`.

---

## Step 3: Main process — New file `update.handler.ts`

**File:** `Foundry/apps/electron/src/main/ipc/update.handler.ts`

```typescript
import { autoUpdater } from "electron-updater";
import { app, BrowserWindow, ipcMain } from "electron";

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

  // Check after 5 seconds
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
```

---

## Step 4: Main entry — `src/main/index.ts`

**File:** `Foundry/apps/electron/src/main/index.ts`

Sửa dòng import (thêm `initAutoUpdater`):
```typescript
import { registerAllHandlers, registerEarlyHandlers, registerTerminalHandlers, setServices } from "@/main/ipc";
import { initAutoUpdater } from "@/main/ipc/update.handler";
```

Sau dòng `console.log("[Foundry] Database connected successfully...")` (khoảng dòng 74), thêm:
```typescript
    // Initialize auto-updater after DB is ready
    initAutoUpdater();

    console.log("[Foundry] Database connected successfully (backend: sqlite)");
```

---

## Step 5: IPC index — register update handlers

**File:** `Foundry/apps/electron/src/main/ipc/index.ts`

Thêm import:
```typescript
import { registerUpdateHandlers } from "@/main/ipc/update.handler";
```

Trong `registerAllHandlers()`, thêm dòng đầu:
```typescript
export function registerAllHandlers(): void {
  registerUpdateHandlers();
  registerClipboardHandlers();
  // ... rest
}
```

---

## Step 6: Preload bridge

**File:** `Foundry/apps/electron/src/preload/index.ts`

Thêm vào `electronAPI` object (sau `clipboard`):
```ts
  update: {
    check: () => ipcRenderer.invoke("update:check"),
    install: () => ipcRenderer.invoke("update:install"),
    onChecking: (cb: () => void) => {
      ipcRenderer.on("update:checking", () => cb());
    },
    onAvailable: (cb: (info: { version: string; releaseNotes?: string }) => void) => {
      ipcRenderer.on("update:available", (_event, info) => cb(info));
    },
    onNotAvailable: (cb: () => void) => {
      ipcRenderer.on("update:not-available", () => cb());
    },
    onDownloaded: (cb: () => void) => {
      ipcRenderer.on("update:downloaded", () => cb());
    },
    onError: (cb: (error: { message: string }) => void) => {
      ipcRenderer.on("update:error", (_event, error) => cb(error));
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners("update:checking");
      ipcRenderer.removeAllListeners("update:available");
      ipcRenderer.removeAllListeners("update:not-available");
      ipcRenderer.removeAllListeners("update:downloaded");
      ipcRenderer.removeAllListeners("update:error");
    },
  },
```

---

## Step 7: Renderer types

**File:** `Foundry/apps/electron/src/renderer/types.ts`

Thêm vào `ElectronAPI` interface (sau `clipboard`):
```ts
  update: {
    check: () => Promise<{ success: boolean; version?: string; reason?: string }>;
    install: () => Promise<{ success: boolean }>;
    onChecking: (cb: () => void) => void;
    onAvailable: (cb: (info: { version: string; releaseNotes?: string }) => void) => void;
    onNotAvailable: (cb: () => void) => void;
    onDownloaded: (cb: () => void) => void;
    onError: (cb: (error: { message: string }) => void) => void;
    removeAllListeners: () => void;
  };
```

---

## Step 8: UI Store — update state

**File:** `Foundry/apps/electron/src/renderer/stores/uiStore.ts`

Thêm type và state:

```ts
type UpdateState = "idle" | "checking" | "available" | "downloading" | "downloaded" | "not-available" | "error";

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
}
```

Thêm vào `UIState` interface:
```ts
  updateState: UpdateState;
  updateInfo: UpdateInfo | null;
  setUpdateState: (state: UpdateState) => void;
  setUpdateInfo: (info: UpdateInfo | null) => void;
```

Thêm giá trị khởi tạo trong `create`:
```ts
  updateState: "idle",
  updateInfo: null,
```

Thêm actions:
```ts
  setUpdateState: (updateState) => set({ updateState }),
  setUpdateInfo: (updateInfo) => set({ updateInfo }),
```

---

## Step 9: Sidebar — update notification badge

**File:** `Foundry/apps/electron/src/renderer/components/dashboard/Sidebar.tsx`

Thêm import:
```tsx
import { ArrowUpCircle, Download } from "lucide-react";
```

Lấy update states từ store:
```tsx
  const updateState = useUIStore((s) => s.updateState);
  const updateInfo = useUIStore((s) => s.updateInfo);
  const setUpdateState = useUIStore((s) => s.setUpdateState);
  const setUpdateInfo = useUIStore((s) => s.setUpdateInfo);
```

Thêm `useEffect` để listener update events:
```tsx
  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.update) return;

    api.update.onChecking(() => setUpdateState("checking"));
    api.update.onAvailable((info) => {
      setUpdateState("available");
      setUpdateInfo(info);
    });
    api.update.onNotAvailable(() => setUpdateState("not-available"));
    api.update.onDownloaded(() => {
      setUpdateState("downloaded");
    });
    api.update.onError(() => setUpdateState("error"));

    return () => {
      api.update.removeAllListeners();
    };
  }, []);
```

Thêm handler:
```tsx
  async function handleInstallUpdate() {
    try {
      await window.electronAPI.update.install();
    } catch {
      addToast("Failed to install update", "error");
    }
  }
```

Thêm vào bottom section (ở cả 2 chế độ collapsed và expanded), **trước** dòng `{dbBackend && (`, hiển thị khi `updateState === "available" || updateState === "downloaded"`:

**Collapsed:**
```tsx
              {(updateState === "available" || updateState === "downloaded") && (
                <button
                  onClick={handleInstallUpdate}
                  className="flex w-full cursor-pointer items-center justify-center rounded-md p-2 text-amber-500 transition-colors hover:bg-amber-500/10"
                  title={`Update to v${updateInfo?.version}`}
                >
                  <ArrowUpCircle size={14} />
                </button>
              )}
```

**Expanded:**
```tsx
              {(updateState === "available" || updateState === "downloaded") && (
                <button
                  onClick={handleInstallUpdate}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-amber-500 transition-colors hover:bg-amber-500/10"
                >
                  <Download size={14} />
                  <span className="flex-1 text-left">
                    {updateState === "downloaded" ? "Restart to update" : `Update v${updateInfo?.version}`}
                  </span>
                  <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-medium text-white">
                    {updateState === "downloaded" ? "OK" : "New"}
                  </span>
                </button>
              )}
```

---

## Step 10: CI/CD — release.yml

**File:** `.github/workflows/release.yml`

Sửa dòng 53-55, bỏ env vars outdated:
```yaml
      - name: Build
        working-directory: Foundry
        run: pnpm build
```

Sửa dòng 59:
```yaml
          run: npx electron-builder ${{ matrix.target }} --publish always
```

---

## Step 11: CI/CD — build.yml

**File:** `.github/workflows/build.yml`

Sửa dòng 55-57, bỏ env vars outdated:
```yaml
      - name: Build
        working-directory: Foundry
        run: pnpm build
```

---

## Step 12: Verify + Commit

```bash
# Install new dependency
cd Foundry
pnpm install

# Build to verify
pnpm run build

# If build passes:
git add -A
git commit -m "feat: add auto-update with electron-updater + GitHub Releases"
git tag -a v0.3.0 -m "v0.3.0 — auto-update with electron-updater"
git push origin master --tags
```

---

## Phiên bản

Tất cả package.json bump lên `0.3.0`:
- `apps/electron/package.json`
- `apps/mcp-server/package.json`
- `packages/database/package.json`
- `packages/domain/package.json`
- `packages/shared/package.json`
- `SettingsPage.tsx` About section → `v0.3.0`

---

## Lưu ý

1. **Dev mode**: `autoUpdater` không hoạt động trong dev (`app.isPackaged = false`). Chỉ test được sau khi build và cài.
2. **GitHub Token**: `GITHUB_TOKEN` được auto-inject trong GitHub Actions. electron-builder tự động dùng `GH_TOKEN` env var.
3. **Public repo**: electron-updater query GitHub Releases API công khai, không cần token ở client.
4. **Blockmap**: electron-builder sẽ tự generate `.blockmap` files cần thiết cho diff-update.
