import { useEffect, useState } from "react";

import { ToastContainer } from "./components/common/ToastContainer";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Sidebar } from "./components/dashboard/Sidebar";
import { SearchModal } from "./components/search/SearchModal";
import { SettingsPage } from "./components/settings/SettingsPage";
import { ConnectionDialog } from "./components/setup/ConnectionDialog";
import { TaskDetail } from "./components/task/TaskDetail";
import { TerminalPanel } from "./components/terminal/TerminalPanel";
import { useProjectStore } from "./stores/projectStore";
import { useTaskStore } from "./stores/taskStore";
import { useUIStore } from "./stores/uiStore";

const STATUS_KEYS: Record<string, string> = {
  "1": "todo",
  "2": "doing",
  "3": "review",
  "4": "done",
};

function needsSetup(db: { backend: string; databaseUrl?: string }): boolean {
  if (db.backend === "sqlite") return false;
  if (db.backend === "supabase" && db.databaseUrl) return false;
  return true;
}

export function App() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const searchOpen = useUIStore((s) => s.searchOpen);
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const moveTask = useTaskStore((s) => s.moveTask);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const createTask = useTaskStore((s) => s.createTask);
  const addToast = useUIStore((s) => s.addToast);
  const setTheme = useUIStore((s) => s.setTheme);
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const terminalOpen = useUIStore((s) => s.terminalOpen);
  const toggleTerminal = useUIStore((s) => s.toggleTerminal);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  const setDbBackend = useUIStore((s) => s.setDbBackend);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    window.electronAPI.config.get().then((cfg) => {
      if (needsSetup(cfg.database)) {
        setShowSetup(true);
        return;
      }
      initializeApp();
    }).catch(() => {
      initializeApp();
    });

    window.electronAPI.setting
      .get("theme")
      .then((saved) => {
        if (saved === "light") setTheme("light");
        else setTheme("dark");
      })
      .catch(() => {});
    window.electronAPI.setting
      .get("sidebarCollapsed")
      .then((saved) => {
        if (saved === "true") setSidebarCollapsed(true);
      })
      .catch(() => {});
  }, []);

  function initializeApp() {
    loadProjects();
    window.electronAPI.db
      .getBackend()
      .then((backend) => {
        setDbBackend(backend);
        if (backend) {
          const isLocal = backend === "sqlite";
          addToast(
            isLocal
              ? "Connected to SQLite (local database)"
              : "Connected to Supabase (cloud database)",
            "info"
          );
        }
      })
      .catch(() => {});
  }

  async function handleSetupComplete(backend: "supabase" | "sqlite") {
    setShowSetup(false);
    const isLocal = backend === "sqlite";
    addToast(
      isLocal
        ? "SQLite config saved. Restart to apply."
        : "Supabase config saved. Restart to apply.",
      "info"
    );
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (meta && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        return;
      }

      if (e.key === "Escape" && selectedTaskId) {
        setSelectedTask(null);
        return;
      }

      if (meta && STATUS_KEYS[e.key] && selectedTaskId) {
        e.preventDefault();
        const newStatus = STATUS_KEYS[e.key];
        moveTask(selectedTaskId, newStatus);
        addToast(`Moved to ${newStatus}`, "info");
        return;
      }

      if (meta && e.key === "n" && currentProjectId) {
        e.preventDefault();
        createTask({ projectId: currentProjectId, title: "New Task" }).catch(() => {});
      }

      if (meta && e.key === "`") {
        e.preventDefault();
        toggleTerminal();
        return;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, selectedTaskId, currentProjectId, toggleSidebar]);

  return (
    <div className="flex h-full">
      {showSetup && (
        <ConnectionDialog onConnected={handleSetupComplete} />
      )}
      <Sidebar collapsed={sidebarCollapsed} />
      <main className="flex min-w-0 flex-1 flex-col">
        {terminalOpen ? <TerminalPanel /> : settingsOpen ? <SettingsPage /> : <Dashboard />}
      </main>
      {selectedTaskId && <TaskDetail />}
      {searchOpen && <SearchModal />}
      <ToastContainer />
    </div>
  );
}
