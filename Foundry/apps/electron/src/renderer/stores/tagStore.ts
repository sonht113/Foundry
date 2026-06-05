import { create } from "zustand";

interface Tag {
  id: string;
  name: string;
}

interface TagState {
  tags: Tag[];
  loading: boolean;
  error: string | null;

  loadTags: () => Promise<void>;
  createTag: (name: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
}

export const useTagStore = create<TagState>((set) => ({
  tags: [],
  loading: false,
  error: null,

  loadTags: async () => {
    set({ loading: true, error: null });
    try {
      const tags = await window.electronAPI.tag.list();
      set({ tags, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createTag: async (name) => {
    const tag = await window.electronAPI.tag.create(name);
    set((state) => ({
      tags: state.tags.some((t) => t.id === tag.id) ? state.tags : [...state.tags, tag],
    }));
    return tag;
  },

  deleteTag: async (id) => {
    await window.electronAPI.tag.delete(id);
    set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }));
  },
}));
