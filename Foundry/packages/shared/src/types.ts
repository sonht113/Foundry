export type TaskStatus = string;
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type ChangeSource = "human" | "ai" | "mcp";

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  estimateHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  projectId: string;
  name: string;
  sortOrder: number;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface TaskTag {
  taskId: string;
  tagId: string;
}

export interface Note {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: ChangeSource;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface TaskWithTags extends Task {
  tags: Tag[];
}

export interface TaskWithAll extends Task {
  tags: Tag[];
  notes: Note[];
}
