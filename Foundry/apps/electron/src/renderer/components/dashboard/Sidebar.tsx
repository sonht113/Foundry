import { AlertCircle, ArrowUpCircle, ChevronLeft, ChevronRight, Command, Download, Hash, Home, Plus, RefreshCw, Search, Settings, Terminal, Trash2, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

import { useProjectStore } from "../../stores/projectStore";
import { useTaskStore } from "../../stores/taskStore";
import { useUIStore } from "../../stores/uiStore";
import type { UpdateState } from "../../stores/uiStore";
import { Button } from "../common/Button";
import { ConfirmModal } from "../common/ConfirmModal";
import { ThemeToggle } from "../common/ThemeToggle";

import { CreateProjectModal } from "./CreateProjectModal";

const PROJECT_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-teal-500",
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadColumns = useTaskStore((s) => s.loadColumns);
  const loading = useTaskStore((s) => s.loading);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const addToast = useUIStore((s) => s.addToast);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const terminalOpen = useUIStore((s) => s.terminalOpen);
  const toggleTerminal = useUIStore((s) => s.toggleTerminal);
  const dbBackend = useUIStore((s) => s.dbBackend);
  const updateState = useUIStore((s) => s.updateState);
  const updateInfo = useUIStore((s) => s.updateInfo);
  const setUpdateState = useUIStore((s) => s.setUpdateState);
  const setUpdateInfo = useUIStore((s) => s.setUpdateInfo);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  function handleSelectProject(id: string) {
    setCurrentProject(id);
    loadTasks(id);
    loadColumns(id);
  }

  async function handleReload() {
    try {
      await loadProjects();
      if (currentProjectId) {
        await Promise.all([loadTasks(currentProjectId), loadColumns(currentProjectId)]);
      }
      handleLoadCounts();
      addToast("Data reloaded", "success");
    } catch {
      addToast("Failed to reload", "error");
    }
  }

  async function handleLoadCounts() {
    for (const p of projects) {
      window.electronAPI.task.list(p.id).then((tasks) => {
        setCounts((prev) => ({ ...prev, [p.id]: tasks.length }));
      });
    }
  }

  useState(() => {
    handleLoadCounts();
  });

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.update) return;

    let mounted = true;

    api.update.onChecking(() => {
      if (!mounted) return;
      setUpdateState("checking");
      setDownloadError(null);
    });
    api.update.onAvailable((info) => {
      if (!mounted) return;
      setUpdateState("available");
      setUpdateInfo(info);
      setDownloadError(null);
    });
    api.update.onNotAvailable(() => {
      if (!mounted) return;
      setUpdateState("not-available");
    });
    api.update.onDownloading((progress) => {
      if (!mounted) return;
      setUpdateState("downloading");
      setDownloadProgress(Math.round(progress.percent));
    });
    api.update.onDownloaded(() => {
      if (!mounted) return;
      setUpdateState("downloaded");
    });
    api.update.onError((error) => {
      if (!mounted) return;
      setUpdateState("error");
      setDownloadError(error.message);
      console.error("[Foundry] Update error:", error.message);
    });

    api.update.getStatus().then((status) => {
      if (!mounted) return;
      if (status.state && status.state !== "idle") {
        setUpdateState(status.state as UpdateState);
        if (status.version) {
          setUpdateInfo({ version: status.version, releaseNotes: status.releaseNotes });
        }
      }
    }).catch(() => {});

    return () => {
      mounted = false;
      api.update.removeAllListeners();
    };
  }, []);

  async function handleInstallUpdate() {
    try {
      await window.electronAPI.update.install();
    } catch {
      addToast("Failed to install update", "error");
    }
  }

  async function handleRetryUpdate() {
    try {
      setUpdateState("checking");
      setDownloadError(null);
      await window.electronAPI.update.check();
    } catch {
      setUpdateState("error");
      setDownloadError("Failed to retry update check");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      addToast(`Deleted "${deleteTarget.name}"`, "success");
      setDeleteTarget(null);
    } catch (e) {
      addToast(`Failed: ${(e as Error).message}`, "error");
    } finally {
      setDeleting(false);
    }
  }

  function getColor(index: number) {
    return PROJECT_COLORS[index % PROJECT_COLORS.length];
  }

  return (
    <>
      <aside
        className={`flex shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 transition-[width] duration-200 dark:border-zinc-800 dark:bg-zinc-950 ${
          collapsed ? "w-12" : "w-56"
        }`}
      >
        <div
          className={`flex items-center border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 ${
            collapsed ? "justify-center px-0" : "justify-between"
          }`}
        >
          <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
            <Hash size={18} className="text-indigo-500 dark:text-indigo-400" />
            {!collapsed && (
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Foundry</span>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="cursor-pointer rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {collapsed ? (
            <>
              <div className="flex justify-center pt-2 pb-1">
                <div
                  className={`flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors ${
                    currentProjectId === null
                      ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-300"
                      : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                  }`}
                  onClick={() => {
                    setCurrentProject(null);
                    setSelectedTask(null);
                  }}
                  title="Overview"
                >
                  <Home size={14} />
                </div>
              </div>

              <div className="flex justify-center py-2">
                <button
                  onClick={() => setShowCreate(true)}
                  className="cursor-pointer rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                  title="New Project"
                >
                  <Plus size={14} />
                </button>
              </div>

              <ul className="space-y-1 px-2">
                {projects.map((project, i) => (
                  <li key={project.id} className="flex justify-center">
                    <div
                      className={`flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors ${
                        currentProjectId === project.id
                          ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-300"
                          : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                      }`}
                      onClick={() => handleSelectProject(project.id)}
                      title={project.name}
                    >
                      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${getColor(i)}`} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <div className="px-3 pt-2 pb-1">
                <div
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    currentProjectId === null
                      ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-300"
                      : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                  }`}
                  onClick={() => {
                    setCurrentProject(null);
                    setSelectedTask(null);
                  }}
                >
                  <Home size={14} />
                  <span className="text-[13px]">Overview</span>
                </div>
              </div>

              <div className="px-3 py-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus size={14} />
                  New Project
                </Button>
              </div>

              <div className="px-3 pb-1">
                <span className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase dark:text-zinc-600">
                  Projects
                </span>
              </div>

              <ul className="space-y-0.5 px-2">
                {projects.map((project, i) => (
                  <li key={project.id}>
                    <div
                      className={`group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                        currentProjectId === project.id
                          ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-300"
                          : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                      }`}
                      onClick={() => handleSelectProject(project.id)}
                    >
                      <div className={`h-2 w-2 shrink-0 rounded-full ${getColor(i)}`} />
                      <span className="flex-1 truncate text-[13px]">{project.name}</span>
                      {counts[project.id] !== undefined && (
                        <span className="text-[10px] text-zinc-400 tabular-nums dark:text-zinc-600">
                          {counts[project.id]}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: project.id, name: project.name });
                        }}
                        className="cursor-pointer rounded p-0.5 text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 dark:text-zinc-600"
                        title="Delete project"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </li>
                ))}
                {projects.length === 0 && (
                  <p className="px-2 py-4 text-center text-xs text-zinc-500 dark:text-zinc-700">
                    No projects yet
                  </p>
                )}
              </ul>
            </>
          )}
        </div>

        <div className="space-y-0.5 border-t border-zinc-200 p-2 dark:border-zinc-800">
          {collapsed ? (
            <>
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex w-full cursor-pointer items-center justify-center rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
                title="Settings"
              >
                <Settings size={14} />
              </button>
              <button
                onClick={handleReload}
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
                title="Reload data"
              >
                <RefreshCw size={14} />
              </button>
              <ThemeToggle collapsed />
              <button
                onClick={() => setSearchOpen(true)}
                className="flex w-full cursor-pointer items-center justify-center rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
                title="Search"
              >
                <Search size={14} />
              </button>
              <button
                onClick={toggleTerminal}
                className={`flex w-full cursor-pointer items-center justify-center rounded-md p-2 transition-colors ${
                  terminalOpen
                    ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-300"
                    : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
                }`}
                title="Terminal"
              >
                <Terminal size={14} />
              </button>
              {updateState === "checking" && (
                <div
                  className="flex w-full cursor-default items-center justify-center rounded-md p-2 text-zinc-400"
                  title="Checking for updates..."
                >
                  <RefreshCw size={14} className="animate-spin" />
                </div>
              )}
              {(updateState === "available" || updateState === "downloaded") && (
                <button
                  onClick={handleInstallUpdate}
                  className="flex w-full cursor-pointer items-center justify-center rounded-md p-2 text-amber-500 transition-colors hover:bg-amber-500/10"
                  title={updateState === "downloaded" ? "Restart to install update" : `Update to v${updateInfo?.version}`}
                >
                  <ArrowUpCircle size={14} />
                </button>
              )}
              {updateState === "downloading" && (
                <div
                  className="flex w-full cursor-default items-center justify-center rounded-md p-2 text-amber-500"
                  title={`Downloading update... ${downloadProgress}%`}
                >
                  <Download size={14} className="animate-pulse" />
                </div>
              )}
              {updateState === "error" && (
                <button
                  onClick={handleRetryUpdate}
                  className="flex w-full cursor-pointer items-center justify-center rounded-md p-2 text-red-500 transition-colors hover:bg-red-500/10"
                  title={downloadError ?? "Update check failed. Click to retry."}
                >
                  <AlertCircle size={14} />
                </button>
              )}
              {dbBackend && (
                <div
                  className="flex w-full cursor-default items-center justify-center rounded-md p-2"
                  title="Database: SQLite (local)"
                >
                  <Wifi size={12} className="text-emerald-500" />
                </div>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
              >
                <Settings size={14} />
                <span className="flex-1 text-left">Settings</span>
              </button>
              <button
                onClick={handleReload}
                disabled={loading}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
              >
                <RefreshCw size={14} />
                <span className="flex-1 text-left">Reload Data</span>
                <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-600">
                  <Command size={10} />Shift+R
                </span>
              </button>
              <ThemeToggle />
              <button
                onClick={() => setSearchOpen(true)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
              >
                <Search size={14} />
                <span className="flex-1 text-left">Search</span>
                <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-600">
                  <Command size={10} />K
                </span>
              </button>
              <button
                onClick={toggleTerminal}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  terminalOpen
                    ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-300"
                    : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
                }`}
              >
                <Terminal size={14} />
                <span className="flex-1 text-left">Terminal</span>
                <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-600">
                  <Command size={10} />`
                </span>
              </button>
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-400 dark:text-zinc-600">
                <Hash size={14} />
                <span className="flex-1">Cmd+1-4 status</span>
              </div>
              {updateState === "checking" && (
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-400">
                  <RefreshCw size={14} className="animate-spin" />
                  <span className="flex-1 text-left">Checking for updates...</span>
                </div>
              )}
              {(updateState === "available" || updateState === "downloaded") && (
                <button
                  onClick={handleInstallUpdate}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-amber-500 transition-colors hover:bg-amber-500/10"
                >
                  <Download size={14} />
                  <span className="flex-1 text-left">
                    {updateState === "downloaded" ? "Restart to update" : `Update v${updateInfo?.version}`}
                  </span>
                  <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-medium text-white">
                    {updateState === "downloaded" ? "OK" : "New"}
                  </span>
                </button>
              )}
              {updateState === "downloading" && (
                <div className="rounded-md px-2 py-1.5 text-sm">
                  <div className="mb-1 flex items-center gap-2 text-amber-500">
                    <Download size={14} className="animate-pulse" />
                    <span className="flex-1 text-left">Downloading {downloadProgress}%</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {updateState === "error" && (
                <div className="rounded-md px-2 py-1.5">
                  <div className="mb-1 flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle size={14} />
                    <span className="flex-1 text-left text-xs truncate">
                      {downloadError ?? "Update failed"}
                    </span>
                  </div>
                  <button
                    onClick={handleRetryUpdate}
                    className="w-full cursor-pointer rounded px-2 py-0.5 text-center text-xs text-amber-500 transition-colors hover:bg-amber-500/10"
                  >
                    Retry
                  </button>
                </div>
              )}
              {dbBackend && (
                <div
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-zinc-400 dark:text-zinc-600"
                  title="Database backend: SQLite (local/offline)"
                >
                  <Wifi size={12} className="text-emerald-500" />
                  <span className="flex-1">SQLite (local)</span>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently delete all tasks and data in this project.`}
        confirmLabel="Delete"
        loading={deleting}
        variant="danger"
      />
    </>
  );
}
