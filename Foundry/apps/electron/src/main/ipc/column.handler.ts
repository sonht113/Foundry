import type { ColumnService } from "@foundry/domain";
import { ipcMain } from "electron";


export function registerColumnHandlers(service: ColumnService): void {
  ipcMain.handle("column:list", (_event, projectId: string) => {
    return service.list(projectId);
  });

  ipcMain.handle("column:get", (_event, id: string) => {
    return service.getById(id);
  });

  ipcMain.handle(
    "column:create",
    (_event, data: { projectId: string; name: string; color?: string }) => {
      return service.create(data);
    }
  );

  ipcMain.handle("column:update", (_event, id: string, data: { name?: string; color?: string }) => {
    return service.update(id, data);
  });

  ipcMain.handle("column:delete", async (_event, id: string) => {
    await service.remove(id);
    return { success: true };
  });

  ipcMain.handle("column:reorder", (_event, projectId: string, columnIds: string[]) => {
    return service.reorder(projectId, columnIds);
  });
}
