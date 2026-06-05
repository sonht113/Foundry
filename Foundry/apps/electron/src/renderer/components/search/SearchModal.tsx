import { ArrowUpDown, Command, CornerDownLeft, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useProjectStore } from "../../stores/projectStore";
import { useTaskStore } from "../../stores/taskStore";
import { useUIStore } from "../../stores/uiStore";

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
}

export function SearchModal() {
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const projects = useProjectStore((s) => s.projects);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim() && !filterStatus && !filterPriority) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const tasks = await window.electronAPI.task.search({
          query: query.trim() || "",
          status: filterStatus ?? undefined,
          priority: filterPriority ?? undefined,
          limit: 20,
        });
        setResults(tasks);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, filterStatus, filterPriority]);

  function handleSelect(task: Task) {
    setCurrentProject(task.projectId);
    loadTasks(task.projectId).then(() => {
      setSelectedTask(task.id);
    });
    setSearchOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  }

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;

  const priorityColor = (p: string) =>
    p === "critical"
      ? "text-red-400 bg-red-500/10"
      : p === "high"
        ? "text-orange-400 bg-orange-500/10"
        : "text-zinc-500 dark:text-zinc-500 bg-zinc-500/10";

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 pt-[15vh] backdrop-blur-sm"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
          <Search size={14} className="text-zinc-400 dark:text-zinc-600" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:text-zinc-600"
            placeholder="Search tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="rounded border border-zinc-300 bg-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <X size={10} />
          </kbd>
        </div>

        {(filterStatus || filterPriority) && (
          <div className="flex items-center gap-1.5 border-b border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-600">Filters:</span>
            {filterStatus && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-400">
                {filterStatus}
                <button onClick={() => setFilterStatus(null)} className="cursor-pointer">
                  <X size={10} />
                </button>
              </span>
            )}
            {filterPriority && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                {filterPriority}
                <button onClick={() => setFilterPriority(null)} className="cursor-pointer">
                  <X size={10} />
                </button>
              </span>
            )}
          </div>
        )}

        {loading && (
          <div className="px-3 py-4 text-center text-sm text-zinc-400 dark:text-zinc-600">
            Searching...
          </div>
        )}

        {!loading && results.length === 0 && (query || filterStatus || filterPriority) && (
          <div className="px-3 py-4 text-center text-sm text-zinc-400 dark:text-zinc-600">
            No tasks found
          </div>
        )}

        {!loading && results.length === 0 && !query && !filterStatus && !filterPriority && (
          <div className="space-y-2 px-3 py-6 text-center">
            <Search size={24} className="mx-auto text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Search by title or description
            </p>
            <div className="flex justify-center gap-1.5">
              {["todo", "doing", "review", "done"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="cursor-pointer rounded-md border border-zinc-300 px-2 py-0.5 text-[10px] text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 dark:text-zinc-500 dark:text-zinc-700 dark:hover:text-zinc-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto py-1">
            {results.map((task, i) => (
              <li
                key={task.id}
                className={`mx-1 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  i === selectedIndex
                    ? "bg-indigo-600/10 text-indigo-200"
                    : "text-zinc-300 hover:bg-zinc-800/50 dark:text-zinc-300 dark:text-zinc-700"
                }`}
                onClick={() => handleSelect(task)}
              >
                <span
                  className={`inline-flex shrink-0 items-center rounded px-1 py-0.5 text-[10px] font-medium uppercase ${priorityColor(task.priority)}`}
                >
                  {task.priority}
                </span>
                <span className="flex-1 truncate">{task.title}</span>
                <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-600">
                  {projectName(task.projectId)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3 border-t border-zinc-200 px-3 py-1.5 text-[10px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
          <span className="flex items-center gap-1">
            <ArrowUpDown size={10} /> Navigate
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft size={10} /> Open
          </span>
          <span className="flex items-center gap-1">Esc Close</span>
          <span className="ml-auto flex items-center gap-1">
            <Command size={10} />K
          </span>
        </div>
      </div>
    </div>
  );
}
