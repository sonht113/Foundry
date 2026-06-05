import { create } from "zustand";

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  loading: boolean;
  error: string | null;

  loadProjects: () => Promise<void>;
  setCurrentProject: (id: string | null) => void;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, name?: string, description?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  unarchiveProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  loading: false,
  error: null,

  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await window.electronAPI.project.list();
      set({ projects, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  setCurrentProject: (id) => set({ currentProjectId: id }),

  createProject: async (name, description) => {
    const project = await window.electronAPI.project.create({ name, description });
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  updateProject: async (id, name, description) => {
    const updated = await window.electronAPI.project.update(id, { name, description });
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  deleteProject: async (id) => {
    await window.electronAPI.project.delete(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
    }));
  },

  archiveProject: async (id) => {
    const project = await window.electronAPI.project.archive(id);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? project : p)),
    }));
  },

  unarchiveProject: async (id) => {
    const project = await window.electronAPI.project.unarchive(id);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? project : p)),
    }));
  },
}));
