import { nanoid } from "nanoid";

export const generateId = {
  project: () => `proj_${nanoid(12)}`,
  task: () => `task_${nanoid(12)}`,
  tag: () => `tag_${nanoid(8)}`,
  note: () => `note_${nanoid(12)}`,
  history: () => `hist_${nanoid(16)}`,
  column: () => `col_${nanoid(8)}`,
  conversation: () => `conv_${nanoid(16)}`,
};
