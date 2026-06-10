import { create } from "zustand";

type Theme = "dark" | "light";
type ToastType = "success" | "error" | "warning" | "info";
export type UpdateState = "idle" | "checking" | "available" | "downloading" | "downloaded" | "not-available" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
}

interface UIState {
  theme: Theme;
  toasts: Toast[];
  searchOpen: boolean;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  settingsOpen: boolean;
  terminalOpen: boolean;
  dbBackend: "sqlite" | null;
  updateState: UpdateState;
  updateInfo: UpdateInfo | null;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  setSearchOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setTerminalOpen: (open: boolean) => void;
  toggleTerminal: () => void;
  setDbBackend: (backend: "sqlite") => void;
  setUpdateState: (state: UpdateState) => void;
  setUpdateInfo: (info: UpdateInfo | null) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  theme: "dark",
  toasts: [],
  searchOpen: false,
  sidebarOpen: true,
  sidebarCollapsed: false,
  settingsOpen: false,
  terminalOpen: false,
  dbBackend: null,
  updateState: "idle",
  updateInfo: null,

  setTheme: (theme) => {
    set({ theme });
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      window.electronAPI.setting?.set("theme", theme).catch(() => {});
    } catch {
      // setting save is non-critical
    }
  },

  toggleTheme: () => {
    const next = useUIStore.getState().theme === "dark" ? "light" : "dark";
    useUIStore.getState().setTheme(next);
  },

  addToast: (message, type = "info") => {
    const id = `toast_${++toastId}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  setSearchOpen: (open) => set({ searchOpen: open }),
  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      try {
        window.electronAPI.setting?.set("sidebarCollapsed", String(next)).catch(() => {});
      } catch {
        // non-critical
      }
      return { sidebarCollapsed: next };
    }),
  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
    try {
      window.electronAPI.setting?.set("sidebarCollapsed", String(collapsed)).catch(() => {});
    } catch {
      // non-critical
    }
  },
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setTerminalOpen: (open) => set({ terminalOpen: open }),
  toggleTerminal: () => set((state) => ({ terminalOpen: !state.terminalOpen })),
  setDbBackend: (backend) => set({ dbBackend: backend }),
  setUpdateState: (updateState) => set({ updateState }),
  setUpdateInfo: (updateInfo) => set({ updateInfo }),
}));
