import { Command, Hash, Home, Plus, Search, Settings, Trash2, X } from "lucide-react";
import { useState } from "react";

import { useProjectStore } from "../../stores/projectStore";
import { useTaskStore } from "../../stores/taskStore";
import { useUIStore } from "../../stores/uiStore";
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

export function Sidebar() {
  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadColumns = useTaskStore((s) => s.loadColumns);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const addToast = useUIStore((s) => s.addToast);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  function handleSelectProject(id: string) {
    setCurrentProject(id);
    loadTasks(id);
    loadColumns(id);
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
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Hash size={18} className="text-indigo-500 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Foundry</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="cursor-pointer rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
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
        </div>

        <div className="space-y-0.5 border-t border-zinc-200 p-2 dark:border-zinc-800">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
          >
            <Settings size={14} />
            <span className="flex-1 text-left">Settings</span>
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
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-400 dark:text-zinc-600">
            <Hash size={14} />
            <span className="flex-1">Cmd+1-4 status</span>
          </div>
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
      />
    </>
  );
}
