import { create } from "zustand";

interface Conversation {
  id: string;
  taskId: string;
  source: string;
  author: string;
  content: string;
  externalId: string | null;
  externalUrl: string | null;
  createdAt: string;
}

interface ConversationState {
  conversations: Record<string, Conversation[]>;
  loading: boolean;
  error: string | null;

  loadConversations: (taskId: string) => Promise<void>;
  addConversation: (taskId: string, conversation: Conversation) => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: {},
  loading: false,
  error: null,

  loadConversations: async (taskId) => {
    set({ loading: true, error: null });
    try {
      const data = await window.electronAPI.conversation.list(taskId);
      set((state) => ({
        conversations: { ...state.conversations, [taskId]: data },
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  addConversation: (taskId, conversation) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [taskId]: [...(state.conversations[taskId] ?? []), conversation],
      },
    }));
  },
}));
