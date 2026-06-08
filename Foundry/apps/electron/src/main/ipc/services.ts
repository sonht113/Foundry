import type { SettingRepository } from "@foundry/database";
import type { ProjectService, ColumnService, TaskService, TagService, NoteService, ConversationService } from "@foundry/domain";

export const services = {
  project: null as ProjectService | null,
  column: null as ColumnService | null,
  task: null as TaskService | null,
  tag: null as TagService | null,
  note: null as NoteService | null,
  conversation: null as ConversationService | null,
  setting: null as SettingRepository | null,
};

export function requireService<T>(service: T | null, name: string): T {
  if (!service) {
    throw new Error(
      `Database not connected (${name} service unavailable). ` +
      `Please configure your database in Settings first.`
    );
  }
  return service;
}

export function setServices(s: {
  projectService: ProjectService;
  columnService: ColumnService;
  taskService: TaskService;
  tagService: TagService;
  noteService: NoteService;
  conversationService: ConversationService;
  settingRepo: SettingRepository;
}): void {
  services.project = s.projectService;
  services.column = s.columnService;
  services.task = s.taskService;
  services.tag = s.tagService;
  services.note = s.noteService;
  services.conversation = s.conversationService;
  services.setting = s.settingRepo;
}
