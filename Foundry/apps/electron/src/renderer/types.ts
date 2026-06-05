interface ElectronAPI {
  project: {
    list: (includeArchived?: boolean) => Promise<Project[]>;
    get: (id: string) => Promise<Project>;
    create: (data: { name: string; description?: string }) => Promise<Project>;
    update: (id: string, data: { name?: string; description?: string }) => Promise<Project>;
    delete: (id: string) => Promise<{ success: boolean }>;
    archive: (id: string) => Promise<Project>;
    unarchive: (id: string) => Promise<Project>;
  };
  column: {
    list: (projectId: string) => Promise<Column[]>;
    get: (id: string) => Promise<Column>;
    create: (data: { projectId: string; name: string; color?: string }) => Promise<Column>;
    update: (id: string, data: { name?: string; color?: string }) => Promise<Column>;
    delete: (id: string) => Promise<{ success: boolean }>;
    reorder: (projectId: string, columnIds: string[]) => Promise<Column[]>;
  };
  task: {
    list: (projectId?: string) => Promise<Task[]>;
    get: (id: string) => Promise<Task & { tags: Tag[] }>;
    create: (data: {
      projectId: string;
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      assignee?: string;
      startDate?: string | null;
      endDate?: string | null;
      estimateHours?: number;
      tags?: string[];
    }) => Promise<Task>;
    update: (
      id: string,
      data: {
        title?: string;
        description?: string;
        status?: string;
        priority?: string;
        assignee?: string;
        startDate?: string | null;
        endDate?: string | null;
        estimateHours?: number;
      }
    ) => Promise<Task>;
    delete: (id: string) => Promise<{ success: boolean }>;
    move: (id: string, status: string) => Promise<Task>;
    search: (data: {
      query: string;
      projectId?: string;
      status?: string;
      priority?: string;
      limit?: number;
    }) => Promise<Task[]>;
    getTags: (taskId: string) => Promise<Tag[]>;
    addTag: (taskId: string, tagId: string) => Promise<{ success: boolean }>;
    removeTag: (taskId: string, tagId: string) => Promise<{ success: boolean }>;
    getHistory: (taskId: string) => Promise<any[]>;
  };
  tag: {
    list: () => Promise<Tag[]>;
    get: (id: string) => Promise<Tag>;
    create: (name: string) => Promise<Tag>;
    delete: (id: string) => Promise<{ success: boolean }>;
  };
  note: {
    list: (taskId: string) => Promise<Note[]>;
    get: (id: string) => Promise<Note>;
    create: (data: { taskId: string; content: string }) => Promise<Note>;
    update: (id: string, content: string) => Promise<Note>;
    delete: (id: string) => Promise<{ success: boolean }>;
  };
  setting: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<{ success: boolean }>;
  };
}

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  estimateHours: number;
  createdAt: string;
  updatedAt: string;
}

interface Column {
  id: string;
  projectId: string;
  name: string;
  sortOrder: number;
  color: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Note {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export type { Project, Task, Column, Tag, Note };
