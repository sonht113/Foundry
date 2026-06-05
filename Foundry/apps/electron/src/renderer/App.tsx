import { useEffect } from "react";

import { ToastContainer } from "./components/common/ToastContainer";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Sidebar } from "./components/dashboard/Sidebar";
import { SearchModal } from "./components/search/SearchModal";
import { SettingsPage } from "./components/settings/SettingsPage";
import { TaskDetail } from "./components/task/TaskDetail";
import { useProjectStore } from "./stores/projectStore";
import { useTaskStore } from "./stores/taskStore";
import { useUIStore } from "./stores/uiStore";

const STATUS_KEYS: Record<string, string> = {
  "1": "todo",
  "2": "doing",
  "3": "review",
  "4": "done",
};

export function App() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
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

  useEffect(() => {
    loadProjects();
    window.electronAPI.setting
      .get("theme")
      .then((saved) => {
        if (saved === "light") setTheme("light");
        else setTheme("dark");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

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
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, selectedTaskId, currentProjectId]);

  return (
    <div className="flex h-full">
      {sidebarOpen && <Sidebar />}
      <main className="flex min-w-0 flex-1 flex-col">
        {settingsOpen ? <SettingsPage /> : <Dashboard />}
      </main>
      {selectedTaskId && <TaskDetail />}
      {searchOpen && <SearchModal />}
      <ToastContainer />
    </div>
  );
}
