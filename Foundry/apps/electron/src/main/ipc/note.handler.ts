import type { NoteService } from "@foundry/domain";
import { ipcMain } from "electron";


export function registerNoteHandlers(service: NoteService): void {
  ipcMain.handle("note:list", (_event, taskId: string) => {
    return service.list(taskId);
  });

  ipcMain.handle("note:get", (_event, id: string) => {
    return service.getById(id);
  });

  ipcMain.handle("note:create", (_event, data: { taskId: string; content: string }) => {
    return service.create(data.taskId, data.content);
  });

  ipcMain.handle("note:update", (_event, id: string, content: string) => {
    return service.update(id, content);
  });

  ipcMain.handle("note:delete", async (_event, id: string) => {
    await service.remove(id);
    return { success: true };
  });
}
