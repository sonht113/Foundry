import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import type { SettingRepository } from "@foundry/database";
import { getBackend } from "@foundry/database";
import type { ProjectService, ColumnService, TaskService, TagService, NoteService } from "@foundry/domain";
import { app, ipcMain } from "electron";

import { registerColumnHandlers } from "@/main/ipc/column.handler";
import { registerConfigHandlers } from "@/main/ipc/config.handler";
import { registerNoteHandlers } from "@/main/ipc/note.handler";
import { registerProjectHandlers } from "@/main/ipc/project.handler";
import { registerSettingHandlers } from "@/main/ipc/setting.handler";
import { registerTagHandlers } from "@/main/ipc/tag.handler";
import { registerTaskHandlers } from "@/main/ipc/task.handler";
import { registerTerminalHandlers } from "@/main/ipc/terminal.handler";

export { registerTerminalHandlers };

const services = {
  project: null as ProjectService | null,
  column: null as ColumnService | null,
  task: null as TaskService | null,
  tag: null as TagService | null,
  note: null as NoteService | null,
  setting: null as SettingRepository | null,
};

export function setServices(s: {
  projectService: ProjectService;
  columnService: ColumnService;
  taskService: TaskService;
  tagService: TagService;
  noteService: NoteService;
  settingRepo: SettingRepository;
}): void {
  services.project = s.projectService;
  services.column = s.columnService;
  services.task = s.taskService;
  services.tag = s.tagService;
  services.note = s.noteService;
  services.setting = s.settingRepo;
}

export function registerAllHandlers(): void {
  registerProjectHandlers({
    list: (inc) => services.project!.list(inc),
    getById: (id) => services.project!.getById(id),
    create: (data) => services.project!.create(data),
    update: (id, data) => services.project!.update(id, data),
    remove: (id) => services.project!.remove(id),
    archive: (id) => services.project!.archive(id),
    unarchive: (id) => services.project!.unarchive(id),
    getTaskCount: (id) => services.project!.getTaskCount(id),
  } as ProjectService);

  registerColumnHandlers({
    list: (pid) => services.column!.list(pid),
    getById: (id) => services.column!.getById(id),
    create: (data) => services.column!.create(data),
    update: (id, data) => services.column!.update(id, data),
    remove: (id) => services.column!.remove(id),
    reorder: (pid, ids) => services.column!.reorder(pid, ids),
  } as ColumnService);

  registerTaskHandlers({
    list: (pid) => services.task!.list(pid),
    getById: (id) => services.task!.getById(id),
    create: (data) => services.task!.create(data),
    update: (id, data) => services.task!.update(id, data),
    remove: (id) => services.task!.remove(id),
    move: (id, s) => services.task!.move(id, s),
    search: (data) => services.task!.search(data),
    getTags: (tid) => services.task!.getTags(tid),
    addTag: (tid, tagId) => services.task!.addTag(tid, tagId),
    removeTag: (tid, tagId) => services.task!.removeTag(tid, tagId),
    getHistory: (tid) => services.task!.getHistory(tid),
  } as TaskService);

  registerTagHandlers({
    list: () => services.tag!.list(),
    getById: (id) => services.tag!.getById(id),
    create: (name) => services.tag!.create(name),
    remove: (id) => services.tag!.remove(id),
  } as TagService);

  registerNoteHandlers({
    list: (tid) => services.note!.list(tid),
    getById: (id) => services.note!.getById(id),
    create: (tid, content) => services.note!.create(tid, content),
    update: (id, content) => services.note!.update(id, content),
    remove: (id) => services.note!.remove(id),
  } as NoteService);

  registerSettingHandlers({
    get: (key) => services.setting!.get(key),
    set: (key, value) => services.setting!.set(key, value),
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

  ipcMain.handle("db:switchBackend", async (_event, backend: "supabase" | "pglite") => {
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
}

function resolveEnvPath(): string {
  const primary = path.join(__dirname, "..", "..", "..", "..", ".env");
  if (existsSync(primary)) return primary;
  const fallback = path.join(__dirname, "..", "..", ".env");
  return fallback;
}
