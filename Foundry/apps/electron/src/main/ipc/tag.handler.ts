import type { TagService } from "@foundry/domain";
import { ipcMain } from "electron";


export function registerTagHandlers(service: TagService): void {
  ipcMain.handle("tag:list", () => {
    return service.list();
  });

  ipcMain.handle("tag:get", (_event, id: string) => {
    return service.getById(id);
  });

  ipcMain.handle("tag:create", (_event, name: string) => {
    return service.create(name);
  });

  ipcMain.handle("tag:delete", async (_event, id: string) => {
    await service.remove(id);
    return { success: true };
  });
}
