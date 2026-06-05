import { create } from "zustand";

interface Column {
  id: string;
  projectId: string;
  name: string;
  sortOrder: number;
  color: string;
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

interface TaskState {
  tasks: Task[];
  columns: Column[];
  selectedTaskId: string | null;
  loading: boolean;
  error: string | null;

  loadTasks: (projectId?: string) => Promise<void>;
  loadColumns: (projectId: string) => Promise<void>;
  setSelectedTask: (id: string | null) => void;
  createTask: (data: {
    projectId: string;
    title: string;
    description?: string;
    priority?: string;
    assignee?: string;
    status?: string;
    startDate?: string | null;
    endDate?: string | null;
    estimateHours?: number;
    tags?: string[];
  }) => Promise<Task>;
  updateTask: (
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
  ) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: string) => Promise<void>;
  moveTaskOptimistic: (id: string, status: string) => void;
  addTag: (taskId: string, tagId: string) => Promise<void>;
  removeTag: (taskId: string, tagId: string) => Promise<void>;
  createColumn: (data: { projectId: string; name: string; color?: string }) => Promise<Column>;
  updateColumn: (id: string, data: { name?: string; color?: string }) => Promise<Column>;
  deleteColumn: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  columns: [],
  selectedTaskId: null,
  loading: false,
  error: null,

  loadTasks: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const tasks = await window.electronAPI.task.list(projectId);
      set({ tasks, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  loadColumns: async (projectId) => {
    try {
      const columns = await window.electronAPI.column.list(projectId);
      set({ columns });
    } catch {
      // columns not critical for display
    }
  },

  setSelectedTask: (id) => set({ selectedTaskId: id }),

  createTask: async (data) => {
    const task = await window.electronAPI.task.create(data);
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (id, data) => {
    const updated = await window.electronAPI.task.update(id, data);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTask: async (id) => {
    await window.electronAPI.task.delete(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
    }));
  },

  moveTask: async (id, status) => {
    const updated = await window.electronAPI.task.move(id, status);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  moveTaskOptimistic: (id, newStatus) => {
    const oldTask = get().tasks.find((t) => t.id === id);
    if (!oldTask) return;
    const oldStatus = oldTask.status;
    if (oldStatus === newStatus) return;

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
      ),
    }));

    window.electronAPI.task.move(id, newStatus).catch(() => {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: oldStatus } : t)),
      }));
    });
  },

  addTag: async (taskId, tagId) => {
    await window.electronAPI.task.addTag(taskId, tagId);
  },

  removeTag: async (taskId, tagId) => {
    await window.electronAPI.task.removeTag(taskId, tagId);
  },

  createColumn: async (data) => {
    const column = await window.electronAPI.column.create(data);
    set((state) => ({ columns: [...state.columns, column] }));
    return column;
  },

  updateColumn: async (id, data) => {
    const updated = await window.electronAPI.column.update(id, data);
    set((state) => ({
      columns: state.columns.map((c) => (c.id === id ? updated : c)),
    }));
    return updated;
  },

  deleteColumn: async (id) => {
    await window.electronAPI.column.delete(id);
    set((state) => ({
      columns: state.columns.filter((c) => c.id !== id),
    }));
  },
}));
