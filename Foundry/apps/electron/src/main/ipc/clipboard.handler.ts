import { clipboard, ipcMain } from "electron";

export function registerClipboardHandlers(): void {
  ipcMain.handle("clipboard:writeText", async (_event, text: string) => {
    clipboard.writeText(text);
    return { success: true };
  });
}
