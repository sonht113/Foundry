import type { ConversationService } from "@foundry/domain";
import { ipcMain } from "electron";

export function registerConversationHandlers(service: ConversationService): void {
  ipcMain.handle("conversation:list", (_event, taskId: string) => {
    return service.list(taskId);
  });

  ipcMain.handle(
    "conversation:create",
    (
      _event,
      data: {
        taskId: string;
        source: string;
        author: string;
        content: string;
        externalId?: string;
        externalUrl?: string;
        createdAt?: string;
      }
    ) => {
      return service.create({
        taskId: data.taskId,
        source: data.source,
        author: data.author,
        content: data.content,
        externalId: data.externalId,
        externalUrl: data.externalUrl,
        createdAt: data.createdAt,
      });
    }
  );
}
