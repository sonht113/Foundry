import { create } from "zustand";

type Theme = "dark" | "light";
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UIState {
  theme: Theme;
  toasts: Toast[];
  searchOpen: boolean;
  sidebarOpen: boolean;
  settingsOpen: boolean;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  setSearchOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSettingsOpen: (open: boolean) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  theme: "dark",
  toasts: [],
  searchOpen: false,
  sidebarOpen: true,
  settingsOpen: false,

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
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
}));
