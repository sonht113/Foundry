import path from "path";


import { createConnection, migrate, ProjectRepository, ColumnRepository, TaskRepository, TagRepository, NoteRepository, ConversationRepository, SettingRepository } from "@foundry/database";
import { createProjectService, createColumnService, createTaskService, createTagService, createNoteService, createConversationService } from "@foundry/domain";
import dotenv from "dotenv";
import { app, BrowserWindow, net, protocol } from "electron";

import { registerAllHandlers, registerEarlyHandlers, registerTerminalHandlers, setServices } from "@/main/ipc";
import { applyDatabaseConfig, loadConfig } from "@/main/ipc/config.handler";

dotenv.config({ path: path.join(__dirname, "..", "..", "..", "..", ".env") });

// Also try the packaged app path: resources/app/.env
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });
}

// Load persistent config from userData — overrides .env if present
const savedConfig = loadConfig();
if (savedConfig.database?.databaseUrl || savedConfig.database?.backend === "pglite") {
  applyDatabaseConfig(savedConfig.database);
}

// If no Supabase URL is configured, auto-fallback to SQLite
if (!process.env.DATABASE_URL && process.env.DATABASE_BACKEND !== "pglite" && process.env.DATABASE_BACKEND !== "sqlite") {
  process.env.DATABASE_BACKEND = "sqlite";
  console.log("[Foundry] No DATABASE_URL found — defaulting to SQLite backend");
}

// SQLite data directory fallback — use OS user data dir for persistence
function resolveLocalDataDir(): void {
  if (process.env.DATABASE_BACKEND !== "pglite" && process.env.DATABASE_BACKEND !== "sqlite") return;
  if (!process.env.SQLITE_DATA_DIR) {
    const userData = app.getPath("userData");
    process.env.SQLITE_DATA_DIR = path.join(userData, "foundry.db");
    console.log("[Foundry] SQLite data dir not set — using:", process.env.SQLITE_DATA_DIR);
  }
}

app.name = "Foundry";

const isDev = process.env.NODE_ENV === "development" || !!process.env.VITE_DEV_SERVER_URL;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Foundry",
    icon: path.join(__dirname, "../../assets/icon-512.png"),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    win.loadURL(devUrl);
  } else {
    win.loadURL("foundry://-/index.html");
  }

  return win;
}

app.whenReady().then(async () => {
  resolveLocalDataDir();

  // Register config handlers early so renderer can call them before DB connects
  registerEarlyHandlers();

  protocol.handle("foundry", (request) => {
    const urlPath = decodeURIComponent(request.url.replace("foundry://-/", ""));
    const filePath = path.join(__dirname, "../renderer", urlPath);
    return net.fetch(`file://${filePath}`);
  });

  // Create window FIRST so app always opens, even if DB fails
  const win = createWindow();
  registerTerminalHandlers(win);

  // Register ALL IPC handlers eagerly — before DB connects
  // Handlers use a registry that gets populated when DB is ready
  registerAllHandlers();

  // Connect to DB in background
  try {
    const { db, pool } = await createConnection();
    await migrate(db);

    const projectRepo = new ProjectRepository(pool);
    const columnRepo = new ColumnRepository(pool);
    const taskRepo = new TaskRepository(pool);
    const tagRepo = new TagRepository(pool);
    const noteRepo = new NoteRepository(pool);
    const conversationRepo = new ConversationRepository(pool);
    const settingRepo = new SettingRepository(pool);

    const projectService = createProjectService({ projectRepo });
    const columnService = createColumnService({ columnRepo });
    const taskService = createTaskService({ taskRepo });
    const tagService = createTagService({ tagRepo });
    const noteService = createNoteService({ noteRepo });
    const conversationService = createConversationService({ conversationRepo });

    setServices({ projectService, columnService, taskService, tagService, noteService, conversationService, settingRepo });

    const backend = process.env.DATABASE_BACKEND || "supabase";
    console.log("[Foundry] Database connected successfully (backend: " + backend + ")");
  } catch (err) {
    console.error("[Foundry] Database connection failed:", err);
    // Window stays open, user can check connection
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWin = createWindow();
      registerTerminalHandlers(newWin);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
