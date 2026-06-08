import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import { getBackend } from "@foundry/database";
import type { SettingRepository } from "@foundry/database";
import type {
  ProjectService,
  ColumnService,
  TaskService,
  TagService,
  NoteService,
  ConversationService,
} from "@foundry/domain";
import { app, ipcMain } from "electron";

import { registerColumnHandlers } from "@/main/ipc/column.handler";
import { registerConfigHandlers } from "@/main/ipc/config.handler";
import { registerConversationHandlers } from "@/main/ipc/conversation.handler";
import { registerMcpHandlers } from "@/main/ipc/mcp.handler";
import { registerNoteHandlers } from "@/main/ipc/note.handler";
import { registerProjectHandlers } from "@/main/ipc/project.handler";
import { reconnectDatabase } from "@/main/ipc/reconnect";
import { requireService, services, setServices } from "@/main/ipc/services";
import { registerSettingHandlers } from "@/main/ipc/setting.handler";
import { registerTagHandlers } from "@/main/ipc/tag.handler";
import { registerTaskHandlers } from "@/main/ipc/task.handler";
import { registerTerminalHandlers } from "@/main/ipc/terminal.handler";

export { registerTerminalHandlers, setServices, reconnectDatabase };

export function registerAllHandlers(): void {
  registerMcpHandlers();

  registerProjectHandlers({
    list: (inc) => requireService(services.project, "Project").list(inc),
    getById: (id) => requireService(services.project, "Project").getById(id),
    create: (data) => requireService(services.project, "Project").create(data),
    update: (id, data) => requireService(services.project, "Project").update(id, data),
    remove: (id) => requireService(services.project, "Project").remove(id),
    archive: (id) => requireService(services.project, "Project").archive(id),
    unarchive: (id) => requireService(services.project, "Project").unarchive(id),
    getTaskCount: (id) => requireService(services.project, "Project").getTaskCount(id),
  } as ProjectService);

  registerColumnHandlers({
    list: (pid) => requireService(services.column, "Column").list(pid),
    getById: (id) => requireService(services.column, "Column").getById(id),
    create: (data) => requireService(services.column, "Column").create(data),
    update: (id, data) => requireService(services.column, "Column").update(id, data),
    remove: (id) => requireService(services.column, "Column").remove(id),
    reorder: (pid, ids) => requireService(services.column, "Column").reorder(pid, ids),
  } as ColumnService);

  registerTaskHandlers({
    list: (pid) => requireService(services.task, "Task").list(pid),
    getById: (id) => requireService(services.task, "Task").getById(id),
    create: (data) => requireService(services.task, "Task").create(data),
    update: (id, data) => requireService(services.task, "Task").update(id, data),
    remove: (id) => requireService(services.task, "Task").remove(id),
    move: (id, s) => requireService(services.task, "Task").move(id, s),
    search: (data) => requireService(services.task, "Task").search(data),
    getTags: (tid) => requireService(services.task, "Task").getTags(tid),
    addTag: (tid, tagId) => requireService(services.task, "Task").addTag(tid, tagId),
    removeTag: (tid, tagId) => requireService(services.task, "Task").removeTag(tid, tagId),
    getHistory: (tid) => requireService(services.task, "Task").getHistory(tid),
  } as TaskService);

  registerTagHandlers({
    list: () => requireService(services.tag, "Tag").list(),
    getById: (id) => requireService(services.tag, "Tag").getById(id),
    create: (name) => requireService(services.tag, "Tag").create(name),
    remove: (id) => requireService(services.tag, "Tag").remove(id),
  } as TagService);

  registerNoteHandlers({
    list: (tid) => requireService(services.note, "Note").list(tid),
    getById: (id) => requireService(services.note, "Note").getById(id),
    create: (tid, content) => requireService(services.note, "Note").create(tid, content),
    update: (id, content) => requireService(services.note, "Note").update(id, content),
    remove: (id) => requireService(services.note, "Note").remove(id),
  } as NoteService);

  registerConversationHandlers({
    list: (tid) => requireService(services.conversation, "Conversation").list(tid),
    create: (data) => requireService(services.conversation, "Conversation").create(data),
  } as ConversationService);

  registerSettingHandlers({
    get: (key) => requireService(services.setting, "Setting").get(key),
    set: (key, value) => requireService(services.setting, "Setting").set(key, value),
  } as SettingRepository);

  registerDbHandlers();
}

export function registerEarlyHandlers(): void {
  registerConfigHandlers();
}

function registerDbHandlers(): void {
  ipcMain.handle("db:getBackend", async () => {
    return getBackend();
  });

  ipcMain.handle("db:switchBackend", async (_event, backend: "supabase" | "sqlite") => {
    const envPath = resolveEnvPath();
    const content = readFileSync(envPath, "utf-8");
    let newContent: string;
    if (/^DATABASE_BACKEND=/m.test(content)) {
      newContent = content.replace(/^DATABASE_BACKEND=.*/m, `DATABASE_BACKEND=${backend}`);
    } else {
      newContent = content + `\nDATABASE_BACKEND=${backend}\n`;
    }
    writeFileSync(envPath, newContent);
    return { backend, needsRestart: true };
  });

  ipcMain.handle("db:restartApp", async () => {
    app.relaunch();
    app.exit();
    return { success: true };
  });

  ipcMain.handle("db:reconnect", async () => {
    return reconnectDatabase();
  });
}

function resolveEnvPath(): string {
  const primary = path.join(__dirname, "..", "..", "..", "..", ".env");
  if (existsSync(primary)) return primary;
  const fallback = path.join(__dirname, "..", "..", ".env");
  return fallback;
}
