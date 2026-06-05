import type { TaskService } from "@foundry/domain";
import { ipcMain } from "electron";


export function registerTaskHandlers(service: TaskService): void {
  ipcMain.handle("task:list", (_event, projectId?: string) => {
    return service.list(projectId);
  });

  ipcMain.handle("task:get", async (_event, id: string) => {
    const task = await service.getById(id);
    const tags = await service.getTags(id);
    return { ...task, tags };
  });

  ipcMain.handle("task:create", (_event, data) => {
    return service.create(data);
  });

  ipcMain.handle("task:update", (_event, id: string, data) => {
    return service.update(id, data);
  });

  ipcMain.handle("task:delete", async (_event, id: string) => {
    await service.remove(id);
    return { success: true };
  });

  ipcMain.handle("task:move", (_event, id: string, status: string) => {
    return service.move(id, status);
  });

  ipcMain.handle("task:search", (_event, data) => {
    return service.search(data);
  });

  ipcMain.handle("task:tags", (_event, taskId: string) => {
    return service.getTags(taskId);
  });

  ipcMain.handle("task:addTag", async (_event, taskId: string, tagId: string) => {
    await service.addTag(taskId, tagId);
    return { success: true };
  });

  ipcMain.handle("task:removeTag", async (_event, taskId: string, tagId: string) => {
    await service.removeTag(taskId, tagId);
    return { success: true };
  });

  ipcMain.handle("task:history", (_event, taskId: string) => {
    return service.getHistory(taskId);
  });
}
