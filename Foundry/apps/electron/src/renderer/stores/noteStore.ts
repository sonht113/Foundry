import { create } from "zustand";

interface Note {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NoteState {
  notes: Record<string, Note[]>;
  loading: boolean;
  error: string | null;

  loadNotes: (taskId: string) => Promise<void>;
  createNote: (taskId: string, content: string) => Promise<Note>;
  updateNote: (id: string, content: string) => Promise<void>;
  deleteNote: (id: string, taskId: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: {},
  loading: false,
  error: null,

  loadNotes: async (taskId) => {
    set({ loading: true, error: null });
    try {
      const taskNotes = await window.electronAPI.note.list(taskId);
      set((state) => ({
        notes: { ...state.notes, [taskId]: taskNotes },
        loading: false,
      }));
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createNote: async (taskId, content) => {
    const note = await window.electronAPI.note.create({ taskId, content });
    set((state) => ({
      notes: {
        ...state.notes,
        [taskId]: [...(state.notes[taskId] || []), note],
      },
    }));
    return note;
  },

  updateNote: async (id, content) => {
    const updated = await window.electronAPI.note.update(id, content);
    set((state) => {
      const newNotes = { ...state.notes };
      for (const taskId in newNotes) {
        newNotes[taskId] = newNotes[taskId].map((n) => (n.id === id ? updated : n));
      }
      return { notes: newNotes };
    });
  },

  deleteNote: async (id, taskId) => {
    await window.electronAPI.note.delete(id);
    set((state) => ({
      notes: {
        ...state.notes,
        [taskId]: (state.notes[taskId] || []).filter((n) => n.id !== id),
      },
    }));
  },
}));
