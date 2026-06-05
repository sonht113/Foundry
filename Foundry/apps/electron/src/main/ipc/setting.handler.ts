import type { SettingRepository } from "@foundry/database";
import { ipcMain } from "electron";


export function registerSettingHandlers(settingRepo: SettingRepository): void {
  ipcMain.handle("setting:get", async (_event, key: string) => {
    return settingRepo.get(key);
  });

  ipcMain.handle("setting:set", async (_event, key: string, value: string) => {
    await settingRepo.set(key, value);
    return { success: true };
  });
}
