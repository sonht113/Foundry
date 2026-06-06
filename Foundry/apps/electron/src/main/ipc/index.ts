import type { SettingRepository } from "@foundry/database";
import type { ProjectService, ColumnService, TaskService, TagService, NoteService } from "@foundry/domain";

import { registerColumnHandlers } from "@/main/ipc/column.handler";
import { registerNoteHandlers } from "@/main/ipc/note.handler";
import { registerProjectHandlers } from "@/main/ipc/project.handler";
import { registerSettingHandlers } from "@/main/ipc/setting.handler";
import { registerTagHandlers } from "@/main/ipc/tag.handler";
import { registerTaskHandlers } from "@/main/ipc/task.handler";
import { registerTerminalHandlers } from "@/main/ipc/terminal.handler";

export { registerTerminalHandlers };

export function registerAllHandlers(
  projectService: ProjectService,
  columnService: ColumnService,
  taskService: TaskService,
  tagService: TagService,
  noteService: NoteService,
  settingRepo: SettingRepository
): void {
  registerProjectHandlers(projectService);
  registerColumnHandlers(columnService);
  registerTaskHandlers(taskService);
  registerTagHandlers(tagService);
  registerNoteHandlers(noteService);
  registerSettingHandlers(settingRepo);
}
