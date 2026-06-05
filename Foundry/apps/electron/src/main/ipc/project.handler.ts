import type { ProjectService } from "@foundry/domain";
import { ipcMain } from "electron";


export function registerProjectHandlers(service: ProjectService): void {
  ipcMain.handle("project:list", (_event, includeArchived?: boolean) => {
    return service.list(includeArchived);
  });

  ipcMain.handle("project:get", (_event, id: string) => {
    return service.getById(id);
  });

  ipcMain.handle("project:create", (_event, data: { name: string; description?: string }) => {
    return service.create(data);
  });

  ipcMain.handle(
    "project:update",
    (_event, id: string, data: { name?: string; description?: string }) => {
      return service.update(id, data);
    }
  );

  ipcMain.handle("project:delete", async (_event, id: string) => {
    await service.remove(id);
    return { success: true };
  });

  ipcMain.handle("project:archive", (_event, id: string) => {
    return service.archive(id);
  });

  ipcMain.handle("project:unarchive", (_event, id: string) => {
    return service.unarchive(id);
  });

  ipcMain.handle("project:taskCount", (_event, id: string) => {
    return service.getTaskCount(id);
  });
}
