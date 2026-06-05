import { contextBridge, ipcRenderer } from "electron";

const electronAPI = {
  project: {
    list: (includeArchived?: boolean) => ipcRenderer.invoke("project:list", includeArchived),
    get: (id: string) => ipcRenderer.invoke("project:get", id),
    create: (data: { name: string; description?: string }) =>
      ipcRenderer.invoke("project:create", data),
    update: (id: string, data: { name?: string; description?: string }) =>
      ipcRenderer.invoke("project:update", id, data),
    delete: (id: string) => ipcRenderer.invoke("project:delete", id),
    archive: (id: string) => ipcRenderer.invoke("project:archive", id),
    unarchive: (id: string) => ipcRenderer.invoke("project:unarchive", id),
  },
  task: {
    list: (projectId?: string) => ipcRenderer.invoke("task:list", projectId),
    get: (id: string) => ipcRenderer.invoke("task:get", id),
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
    }) => ipcRenderer.invoke("task:create", data),
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
    ) => ipcRenderer.invoke("task:update", id, data),
    delete: (id: string) => ipcRenderer.invoke("task:delete", id),
    move: (id: string, status: string) => ipcRenderer.invoke("task:move", id, status),
    search: (data: {
      query: string;
      projectId?: string;
      status?: string;
      priority?: string;
      limit?: number;
    }) => ipcRenderer.invoke("task:search", data),
    getTags: (taskId: string) => ipcRenderer.invoke("task:tags", taskId),
    addTag: (taskId: string, tagId: string) => ipcRenderer.invoke("task:addTag", taskId, tagId),
    removeTag: (taskId: string, tagId: string) =>
      ipcRenderer.invoke("task:removeTag", taskId, tagId),
    getHistory: (taskId: string) => ipcRenderer.invoke("task:history", taskId),
  },
  column: {
    list: (projectId: string) => ipcRenderer.invoke("column:list", projectId),
    get: (id: string) => ipcRenderer.invoke("column:get", id),
    create: (data: { projectId: string; name: string; color?: string }) =>
      ipcRenderer.invoke("column:create", data),
    update: (id: string, data: { name?: string; color?: string }) =>
      ipcRenderer.invoke("column:update", id, data),
    delete: (id: string) => ipcRenderer.invoke("column:delete", id),
    reorder: (projectId: string, columnIds: string[]) =>
      ipcRenderer.invoke("column:reorder", projectId, columnIds),
  },
  tag: {
    list: () => ipcRenderer.invoke("tag:list"),
    get: (id: string) => ipcRenderer.invoke("tag:get", id),
    create: (name: string) => ipcRenderer.invoke("tag:create", name),
    delete: (id: string) => ipcRenderer.invoke("tag:delete", id),
  },
  note: {
    list: (taskId: string) => ipcRenderer.invoke("note:list", taskId),
    get: (id: string) => ipcRenderer.invoke("note:get", id),
    create: (data: { taskId: string; content: string }) => ipcRenderer.invoke("note:create", data),
    update: (id: string, content: string) => ipcRenderer.invoke("note:update", id, content),
    delete: (id: string) => ipcRenderer.invoke("note:delete", id),
  },
  setting: {
    get: (key: string) => ipcRenderer.invoke("setting:get", key),
    set: (key: string, value: string) => ipcRenderer.invoke("setting:set", key, value),
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
