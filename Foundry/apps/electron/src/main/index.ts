import path from "path";


import { createConnection, migrate, getPool , ProjectRepository, ColumnRepository, TaskRepository, TagRepository, NoteRepository, SettingRepository } from "@foundry/database";
import { createProjectService, createColumnService, createTaskService, createTagService, createNoteService } from "@foundry/domain";
import dotenv from "dotenv";
import { app, BrowserWindow, net, protocol } from "electron";

import { registerAllHandlers, registerTerminalHandlers } from "@/main/ipc";

dotenv.config({ path: path.join(__dirname, "..", "..", "..", "..", ".env") });

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
  protocol.handle("foundry", (request) => {
    const urlPath = decodeURIComponent(request.url.replace("foundry://-/", ""));
    const filePath = path.join(__dirname, "../renderer", urlPath);
    return net.fetch(`file://${filePath}`);
  });

  const { db } = createConnection();
  await migrate(db);

  const pool = getPool();

  const projectRepo = new ProjectRepository(pool);
  const columnRepo = new ColumnRepository(pool);
  const taskRepo = new TaskRepository(pool);
  const tagRepo = new TagRepository(pool);
  const noteRepo = new NoteRepository(pool);
  const settingRepo = new SettingRepository(pool);

  const projectService = createProjectService({ projectRepo });
  const columnService = createColumnService({ columnRepo });
  const taskService = createTaskService({ taskRepo });
  const tagService = createTagService({ tagRepo });
  const noteService = createNoteService({ noteRepo });

  registerAllHandlers(projectService, columnService, taskService, tagService, noteService, settingRepo);

  const win = createWindow();
  registerTerminalHandlers(win);

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
