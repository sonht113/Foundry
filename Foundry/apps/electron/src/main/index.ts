import path from "path";


import { createConnection, migrate, ProjectRepository, ColumnRepository, TaskRepository, TagRepository, NoteRepository, ConversationRepository, SettingRepository } from "@foundry/database";
import { createProjectService, createColumnService, createTaskService, createTagService, createNoteService, createConversationService } from "@foundry/domain";
import { app, BrowserWindow, net, protocol } from "electron";

import { registerAllHandlers, registerEarlyHandlers, registerTerminalHandlers, setServices } from "@/main/ipc";
import { initAutoUpdater } from "@/main/ipc/update.handler";

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
  registerEarlyHandlers();

  protocol.handle("foundry", (request) => {
    const urlPath = decodeURIComponent(request.url.replace("foundry://-/", ""));
    const filePath = path.join(__dirname, "../renderer", urlPath);
    return net.fetch(`file://${filePath}`);
  });

  const win = createWindow();
  registerTerminalHandlers(win);

  registerAllHandlers();

  try {
    const { pool } = await createConnection();
    await migrate();

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

    console.log("[Foundry] Database connected successfully (backend: sqlite)");

    initAutoUpdater();
  } catch (err) {
    console.error("[Foundry] Database connection failed:", err);
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
