import {
  closeConnection,
  createConnection,
  getBackend,
  migrate,
  ProjectRepository,
  ColumnRepository,
  TaskRepository,
  TagRepository,
  NoteRepository,
  ConversationRepository,
  SettingRepository,
} from "@foundry/database";
import {
  createProjectService,
  createColumnService,
  createTaskService,
  createTagService,
  createNoteService,
  createConversationService,
} from "@foundry/domain";

import { setServices } from "./services";

export async function reconnectDatabase(): Promise<{ success: boolean; backend: string }> {
  try {
    await closeConnection();

    const { db, pool } = await createConnection();
    await migrate(db);

    const projectRepo = new ProjectRepository(pool);
    const columnRepo = new ColumnRepository(pool);
    const taskRepo = new TaskRepository(pool);
    const tagRepo = new TagRepository(pool);
    const noteRepo = new NoteRepository(pool);
    const conversationRepo = new ConversationRepository(pool);
    const settingRepo = new SettingRepository(pool);

    const projectService = createProjectService({ projectRepo });
    const columnService = createColumnService({ columnRepo });
    const taskService = createTaskService({ taskRepo });
    const tagService = createTagService({ tagRepo });
    const noteService = createNoteService({ noteRepo });
    const conversationService = createConversationService({ conversationRepo });

    setServices({ projectService, columnService, taskService, tagService, noteService, conversationService, settingRepo });

    const backend = getBackend();
    console.log("[Foundry] Database reconnected (backend: " + backend + ")");
    return { success: true, backend };
  } catch (err) {
    console.error("[Foundry] Reconnection failed:", err);
    throw err;
  }
}
