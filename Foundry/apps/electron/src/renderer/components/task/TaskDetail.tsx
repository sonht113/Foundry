import { CalendarDays, Clock3, GripVertical, Paperclip, Play, StickyNote, User, X } from "lucide-react";
import { useEffect, useState } from "react";

import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, PRIORITY_COLORS } from "../../lib/constants";
import { formatSafeDate } from "../../lib/formatDate";
import { useNoteStore } from "../../stores/noteStore";
import { useTaskStore } from "../../stores/taskStore";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../common/Button";

interface HistoryRow {
  id: string;
  task_id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  created_at: string;
}

export function TaskDetail() {
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);
  const tasks = useTaskStore((s) => s.tasks);
  const columns = useTaskStore((s) => s.columns);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const moveTask = useTaskStore((s) => s.moveTask);
  const notes = useNoteStore((s) => s.notes);
  const loadNotes = useNoteStore((s) => s.loadNotes);
  const createNote = useNoteStore((s) => s.createNote);
  const deleteNote = useNoteStore((s) => s.deleteNote);
  const addToast = useUIStore((s) => s.addToast);

  const task = tasks.find((t) => t.id === selectedTaskId);
  const taskNotes = selectedTaskId ? (notes[selectedTaskId] ?? []) : [];
  const [noteContent, setNoteContent] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [assigneeInput, setAssigneeInput] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState("");
  const [history, setHistory] = useState<HistoryRow[]>([]);

  useEffect(() => {
    if (selectedTaskId) {
      loadNotes(selectedTaskId);
      window.electronAPI.task
        .getHistory(selectedTaskId)
        .then(setHistory)
        .catch(() => {});
    }
  }, [selectedTaskId]);

  if (!task) return null;

  async function handleTitleSave() {
    if (!titleInput.trim()) return;
    try {
      await updateTask(task!.id, { title: titleInput.trim() });
      setEditingTitle(false);
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  }

  async function handleAssigneeSave() {
    try {
      await updateTask(task!.id, { assignee: assigneeInput.trim() });
      setEditingAssignee(false);
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  }

  async function handleDescriptionSave() {
    try {
      await updateTask(task!.id, { description: descriptionInput.trim() });
      setEditingDescription(false);
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(task!.id);
      addToast("Task deleted", "success");
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  }

  async function handleChangeStatus(status: string) {
    try {
      await moveTask(task!.id, status);
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  }

  async function handleAddNote() {
    if (!noteContent.trim()) return;
    try {
      await createNote(task!.id, noteContent.trim());
      setNoteContent("");
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      await deleteNote(noteId, task!.id);
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  }

  function formatHistory(field: string, oldVal: string | null, newVal: string | null): string {
    const labels: Record<string, string> = {
      title: "Title",
      status: "Status",
      priority: "Priority",
      assignee: "Assignee",
      description: "Description",
      start_date: "Start Date",
      end_date: "End Date",
      estimate_hours: "Estimate",
      created: "Created",
    };
    const label = labels[field] ?? field;
    if (field === "created") return `Task created`;
    return `${label}: ${oldVal ?? "—"} → ${newVal ?? "—"}`;
  }

  return (
    <div className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-zinc-200 bg-zinc-50 dark:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setSelectedTask(null)}
          className="flex cursor-pointer items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-600 dark:text-zinc-300 dark:text-zinc-500 dark:text-zinc-700 dark:hover:text-zinc-300 dark:hover:text-zinc-600"
        >
          <X size={14} /> Close
        </button>
      </div>

      <div className="space-y-5 p-4">
        {/* Status selector */}
        <div className="flex flex-wrap rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
          {columns.map((col) => (
            <button
              key={col.id}
              onClick={() => handleChangeStatus(col.id)}
              className={`cursor-pointer rounded-md px-2 py-1.5 text-[11px] font-medium transition-all ${
                task.status === col.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-600 dark:text-zinc-300 dark:text-zinc-500 dark:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {col.name}
            </button>
          ))}
        </div>

        {/* Title */}
        {editingTitle ? (
          <input
            className="w-full rounded border border-indigo-500 bg-white px-2 py-1 text-sm font-semibold text-zinc-900 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
              if (e.key === "Escape") setEditingTitle(false);
            }}
            autoFocus
          />
        ) : (
          <h2
            className="cursor-pointer text-lg leading-snug font-semibold text-zinc-900 transition-colors hover:text-indigo-400 dark:text-zinc-100"
            onClick={() => {
              setTitleInput(task.title);
              setEditingTitle(true);
            }}
          >
            {task.title}
          </h2>
        )}

        {/* Meta info */}
        <div className="space-y-2.5">
          {/* Priority */}
          <div className="flex items-start gap-2 text-sm">
            <GripVertical size={14} className="mt-1 shrink-0 text-zinc-400 dark:text-zinc-600" />
            <span className="w-16 shrink-0 pt-0.5 text-xs text-zinc-500 dark:text-zinc-500">Priority</span>
            <div className="flex flex-wrap gap-1">
              {TASK_PRIORITIES.map((p) => {
                const c = PRIORITY_COLORS[p];
                return (
                  <button
                    key={p}
                    onClick={() => {
                      if (p !== task.priority) {
                        updateTask(task.id, { priority: p }).catch((err) => addToast(err.message, "error"));
                      }
                    }}
                    className={`cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                      task.priority === p
                        ? `${c.bg} ${c.text} ring-2 ring-offset-1 ring-current`
                        : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {TASK_PRIORITY_LABELS[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2 text-sm">
            <Play size={14} className="shrink-0 text-zinc-400 dark:text-zinc-600" />
            <span className="w-16 text-xs text-zinc-500 dark:text-zinc-500">Start</span>
            <input
              type="date"
              value={task.startDate ? task.startDate.slice(0, 10) : ""}
              onChange={(e) => {
                const val = e.target.value || null;
                updateTask(task.id, { startDate: val ? new Date(val).toISOString() : null }).catch((err) =>
                  addToast(err.message, "error")
                );
              }}
              className="cursor-pointer rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays size={14} className="shrink-0 text-zinc-400 dark:text-zinc-600" />
            <span className="w-16 text-xs text-zinc-500 dark:text-zinc-500">End</span>
            <input
              type="date"
              value={task.endDate ? task.endDate.slice(0, 10) : ""}
              onChange={(e) => {
                const val = e.target.value || null;
                updateTask(task.id, { endDate: val ? new Date(val).toISOString() : null }).catch((err) =>
                  addToast(err.message, "error")
                );
              }}
              className="cursor-pointer rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
          </div>

          {/* Estimate Hours */}
          <div className="flex items-center gap-2 text-sm">
            <Clock3 size={14} className="shrink-0 text-zinc-400 dark:text-zinc-600" />
            <span className="w-16 text-xs text-zinc-500 dark:text-zinc-500">Estimate</span>
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="Hours"
              value={task.estimateHours || ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : 0;
                updateTask(task.id, { estimateHours: val }).catch((err) =>
                  addToast(err.message, "error")
                );
              }}
              className="w-20 cursor-pointer rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
            <span className="text-xs text-zinc-400 dark:text-zinc-600">h</span>
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-2 text-sm">
            <User size={14} className="shrink-0 text-zinc-400 dark:text-zinc-600" />
            <span className="w-16 text-xs text-zinc-500 dark:text-zinc-500">Assignee</span>
            {editingAssignee ? (
              <input
                className="flex-1 rounded border border-indigo-500 bg-white px-2 py-0.5 text-xs text-zinc-900 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                onBlur={handleAssigneeSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAssigneeSave();
                  if (e.key === "Escape") setEditingAssignee(false);
                }}
                autoFocus
              />
            ) : (
              <span
                onClick={() => {
                  setAssigneeInput(task.assignee);
                  setEditingAssignee(true);
                }}
                className="flex-1 cursor-pointer rounded px-2 py-0.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:text-zinc-400 dark:text-zinc-600"
              >
                {task.assignee || "Unassigned — click to set"}
              </span>
            )}
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays size={14} className="shrink-0 text-zinc-400 dark:text-zinc-600" />
            <span className="w-16 text-xs text-zinc-500 dark:text-zinc-500">Created</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-500">
              {formatSafeDate(task.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock3 size={14} className="shrink-0 text-zinc-400 dark:text-zinc-600" />
            <span className="w-16 text-xs text-zinc-500 dark:text-zinc-500">Updated</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-500">
              {formatSafeDate(task.updatedAt)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Paperclip size={12} className="text-zinc-400 dark:text-zinc-600" />
            <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-500">
              Description
            </span>
          </div>
          {editingDescription ? (
            <div className="space-y-1.5">
              <textarea
                className="h-24 w-full resize-none rounded-lg border border-indigo-500 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setEditingDescription(false);
                  }
                  if (e.key === "Enter" && e.metaKey) {
                    handleDescriptionSave();
                  }
                }}
                placeholder="Add description..."
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setEditingDescription(false)}
                  className="cursor-pointer rounded px-2.5 py-1 text-[11px] text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDescriptionSave}
                  className="cursor-pointer rounded bg-indigo-600 px-2.5 py-1 text-[11px] text-white hover:bg-indigo-500"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p
              onClick={() => {
                setDescriptionInput(task.description);
                setEditingDescription(true);
              }}
              className="cursor-pointer rounded-lg bg-white p-3 text-sm leading-relaxed text-zinc-800 transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/50"
            >
              {task.description || "No description — click to add"}
            </p>
          )}
        </div>

        {/* Activity log */}
        {history.length > 0 && (
          <div>
            <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-500">
              Activity
            </h3>
            <div className="space-y-1.5">
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-2 text-xs">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-700" />
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-400 dark:text-zinc-600">
                      {formatHistory(h.field, h.old_value, h.new_value)}
                    </span>
                    <span className="ml-2 text-zinc-400 dark:text-zinc-600">
                      {new Date(h.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <StickyNote size={12} className="text-zinc-400 dark:text-zinc-600" />
            <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-500">
              Notes
            </span>
            <span className="ml-auto text-[10px] text-zinc-400 dark:text-zinc-600">
              {taskNotes.length}
            </span>
          </div>
          <div className="space-y-2">
            {taskNotes.map((note) => (
              <div
                key={note.id}
                className="group rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs leading-relaxed whitespace-pre-wrap text-zinc-300 dark:text-zinc-300 dark:text-zinc-700">
                  {note.content}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
                    {formatSafeDate(note.createdAt)}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="cursor-pointer text-[10px] text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400 dark:text-zinc-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:text-zinc-600"
                placeholder="Add a note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
              <Button size="sm" onClick={handleAddNote} disabled={!noteContent.trim()}>
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Delete */}
        <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <button
            onClick={handleDelete}
            className="cursor-pointer text-xs text-zinc-400 transition-colors hover:text-red-400 dark:text-zinc-600"
          >
            Delete task
          </button>
        </div>
      </div>
    </div>
  );
}
