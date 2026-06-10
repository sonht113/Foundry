import { useEffect, useState } from "react";

import { ToastContainer } from "./components/common/ToastContainer";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Sidebar } from "./components/dashboard/Sidebar";
import { SearchModal } from "./components/search/SearchModal";
import { SettingsPage } from "./components/settings/SettingsPage";
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

export function App() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const searchOpen = useUIStore((s) => s.searchOpen);
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadColumns = useTaskStore((s) => s.loadColumns);
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

  async function reloadData() {
    try {
      await loadProjects();
      if (currentProjectId) {
        await Promise.all([loadTasks(currentProjectId), loadColumns(currentProjectId)]);
      }
      addToast("Data reloaded", "success");
    } catch {
      addToast("Failed to reload data", "error");
    }
  }

  useEffect(() => {
    initializeApp();

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
    setDbBackend("sqlite");
    addToast("Connected to SQLite (local database)", "info");
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

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        reloadData().catch(() => {});
        return;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, selectedTaskId, currentProjectId, toggleSidebar]);

  return (
    <div className="flex h-full">
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
