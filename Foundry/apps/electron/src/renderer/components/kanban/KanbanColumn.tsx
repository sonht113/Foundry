import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, PRIORITY_COLORS } from "../../lib/constants";
import { useTaskStore } from "../../stores/taskStore";
import { useUIStore } from "../../stores/uiStore";
import { ConfirmModal } from "../common/ConfirmModal";

import { SortableTaskCard } from "./TaskCard";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: string;
  startDate: string | null;
  endDate: string | null;
  estimateHours: number;
}

interface Props {
  id: string;
  label: string;
  color: string;
  tasks: Task[];
  projectId: string;
  onTaskClick: (id: string) => void;
}

const COLOR_BORDER: Record<string, string> = {
  zinc: "border-zinc-500",
  blue: "border-blue-500",
  amber: "border-amber-500",
  emerald: "border-emerald-500",
  red: "border-red-500",
  violet: "border-violet-500",
  teal: "border-teal-500",
  orange: "border-orange-500",
};

const COLOR_BG: Record<string, string> = {
  zinc: "bg-zinc-500/10",
  blue: "bg-blue-500/10",
  amber: "bg-amber-500/10",
  emerald: "bg-emerald-500/10",
  red: "bg-red-500/10",
  violet: "bg-violet-500/10",
  teal: "bg-teal-500/10",
  orange: "bg-orange-500/10",
};

const DEFAULT_IDS = new Set(["todo", "doing", "review", "done"]);

export function KanbanColumn({ id, label, color, tasks, projectId, onTaskClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const createTask = useTaskStore((s) => s.createTask);
  const updateColumn = useTaskStore((s) => s.updateColumn);
  const deleteColumn = useTaskStore((s) => s.deleteColumn);
  const addToast = useUIStore((s) => s.addToast);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState("medium");
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState(label);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const borderColor = COLOR_BORDER[color] ?? COLOR_BORDER.zinc;
  const bgColor = COLOR_BG[color] ?? COLOR_BG.zinc;
  const isDefault = DEFAULT_IDS.has(id);

  async function handleQuickAdd() {
    if (!quickTitle.trim()) return;
    try {
      await createTask({
        projectId,
        title: quickTitle.trim(),
        status: id,
        priority: quickPriority,
      });
      resetQuickAdd();
    } catch (e) {
      addToast(`Failed: ${(e as Error).message}`, "error");
    }
  }

  function resetQuickAdd() {
    setQuickTitle("");
    setQuickPriority("medium");
    setShowQuickAdd(false);
  }

  async function handleRename() {
    if (!renameInput.trim()) return;
    try {
      await updateColumn(id, { name: renameInput.trim() });
      setRenaming(false);
    } catch (e) {
      addToast(`Failed: ${(e as Error).message}`, "error");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteColumn(id);
      addToast(`Column "${label}" deleted`, "success");
      setShowDeleteConfirm(false);
    } catch (e) {
      addToast(`Failed: ${(e as Error).message}`, "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`group flex w-60 shrink-0 flex-col rounded-xl border transition-all duration-200 ${
        isOver
          ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10"
          : "border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50"
      }`}
    >
      <div
        className={`flex items-center gap-2 rounded-t-xl px-3 py-2.5 ${bgColor} border-b border-zinc-200 dark:border-zinc-800`}
      >
        <div className={`h-2 w-2 rounded-full ${borderColor}`} />
        {renaming ? (
          <input
            className="min-w-0 flex-1 rounded border border-indigo-500 bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-900 focus:outline-none dark:bg-zinc-800 dark:text-zinc-100"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            onBlur={() => setRenaming(false)}
            autoFocus
          />
        ) : (
          <span className="flex-1 truncate text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            {label}
          </span>
        )}
        <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800">
          {tasks.length}
        </span>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`cursor-pointer rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-400 ${
              menuOpen
                ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div
              className="absolute top-6 right-0 z-20 w-32 rounded-lg border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
              onClick={() => setMenuOpen(false)}
            >
              <button
                onClick={() => {
                  setRenameInput(label);
                  setRenaming(true);
                }}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Rename
              </button>
              {!isDefault && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-800"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-1.5 p-2">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
          ))}
          {tasks.length === 0 && !showQuickAdd && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-10 text-zinc-400 transition-colors dark:border-zinc-800 dark:text-zinc-700">
              <GripVertical size={16} className="mb-1 opacity-40" />
              <span className="text-[11px]">Drop here</span>
            </div>
          )}

          {showQuickAdd && (
            <div className="rounded-lg border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
              <input
                className="mb-1.5 w-full rounded border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                placeholder="Task title..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleQuickAdd();
                  if (e.key === "Escape") resetQuickAdd();
                }}
                autoFocus
              />
              <div className="mb-2 flex gap-1">
                {TASK_PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuickPriority(p)}
                    className={`cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-medium transition-all ${
                      quickPriority === p
                        ? `${PRIORITY_COLORS[p].bg} ${PRIORITY_COLORS[p].text}`
                        : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {TASK_PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleQuickAdd}
                  disabled={!quickTitle.trim()}
                  className="flex-1 cursor-pointer rounded bg-indigo-600 px-2 py-1 text-[11px] text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={resetQuickAdd}
                  className="cursor-pointer rounded bg-zinc-200 px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!showQuickAdd && (
            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-500 dark:text-zinc-600 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-400"
            >
              <Plus size={12} />
              Add task
            </button>
          )}
        </div>
      </SortableContext>

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Column"
        message={`Delete "${label}" column? Tasks in this column will be moved to the default column.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
