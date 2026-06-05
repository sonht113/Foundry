import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { forwardRef, useState } from "react";

import { useTaskStore } from "../../stores/taskStore";
import { useUIStore } from "../../stores/uiStore";
import { Skeleton } from "../common/Skeleton";

import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";

export const KanbanBoard = forwardRef<HTMLDivElement>(function KanbanBoard(_props, ref) {
  const tasks = useTaskStore((s) => s.tasks);
  const columns = useTaskStore((s) => s.columns);
  const loading = useTaskStore((s) => s.loading);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const moveTaskOptimistic = useTaskStore((s) => s.moveTaskOptimistic);
  const createColumn = useTaskStore((s) => s.createColumn);
  const addToast = useUIStore((s) => s.addToast);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const currentProjectId = tasks.length > 0 ? tasks[0].projectId : null;

  const columnTasks = columns.reduce(
    (acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id);
      return acc;
    },
    {} as Record<string, typeof tasks>
  );

  const activeTask = tasks.find((t) => t.id === activeId);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const overColumn = columns.find((c) => c.id === overId);
    const overTask = tasks.find((t) => t.id === overId);

    if (overColumn && overColumn.id !== activeTask?.status) {
      moveTaskOptimistic(taskId, overColumn.id);
      addToast(`Moved to ${overColumn.name}`, "info");
      return;
    }

    if (overTask && overTask.status !== activeTask?.status) {
      const targetCol = columns.find((c) => c.id === overTask.status);
      moveTaskOptimistic(taskId, overTask.status);
      addToast(`Moved to ${targetCol?.name ?? overTask.status}`, "info");
    }
  }

  async function handleAddColumn() {
    if (!newColumnName.trim() || !currentProjectId) return;
    try {
      const colors = ["zinc", "blue", "amber", "emerald", "red", "violet", "teal", "orange"];
      const usedColors = new Set(columns.map((c) => c.color));
      const color = colors.find((c) => !usedColors.has(c)) ?? "zinc";
      await createColumn({ projectId: currentProjectId, name: newColumnName.trim(), color });
      setNewColumnName("");
      setShowAddColumn(false);
      addToast(`Column "${newColumnName.trim()}" added`, "success");
    } catch (e) {
      addToast(`Failed: ${(e as Error).message}`, "error");
    }
  }

  if (loading || (columns.length === 0 && tasks.length === 0)) {
    return (
      <div className="flex gap-3">
        {([1, 2, 3, 4] as const).map((i) => (
          <div
            key={i}
            className="w-60 shrink-0 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <Skeleton className="mb-3 h-5 w-16" />
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="text-center text-sm text-zinc-500">
        No columns configured for this project.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div ref={ref} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            label={col.name}
            color={col.color}
            tasks={columnTasks[col.id] ?? []}
            projectId={currentProjectId ?? ""}
            onTaskClick={setSelectedTask}
          />
        ))}

        {showAddColumn ? (
          <div className="flex w-60 shrink-0 flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
            <input
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              placeholder="Column name..."
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddColumn();
                if (e.key === "Escape") {
                  setShowAddColumn(false);
                  setNewColumnName("");
                }
              }}
              autoFocus
            />
            <div className="flex gap-1">
              <button
                onClick={handleAddColumn}
                disabled={!newColumnName.trim()}
                className="flex-1 cursor-pointer rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddColumn(false);
                  setNewColumnName("");
                }}
                className="cursor-pointer rounded bg-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddColumn(true)}
            className="flex h-fit w-60 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-xs text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
          >
            <Plus size={14} />
            Add Column
          </button>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className="rotate-2">
            <TaskCard task={activeTask} isOverlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
});
