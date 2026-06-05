import { ClipboardList, Plus } from "lucide-react";
import { useRef, useState } from "react";

import { useProjectStore } from "../../stores/projectStore";
import { useTaskStore } from "../../stores/taskStore";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { HorizontalScrollBar } from "../common/HorizontalScrollBar";
import { HomePage } from "../home/HomePage";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { QuickCreateModal } from "../task/QuickCreateModal";

export function Dashboard() {
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const projects = useProjectStore((s) => s.projects);
  const tasks = useTaskStore((s) => s.tasks);
  const loading = useTaskStore((s) => s.loading);
  const [showCreate, setShowCreate] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  if (!currentProject) {
    return <HomePage />;
  }

  const doing = tasks.filter((t) => t.status === "doing").length;
  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {currentProject.name}
          </h1>
          {!loading && tasks.length > 0 && (
            <p className="flex items-center gap-2 text-xs text-zinc-500">
              <ClipboardList size={12} />
              {tasks.length} tasks
              {doing > 0 && (
                <span className="text-blue-700 dark:text-blue-400">{doing} in progress</span>
              )}
              {done > 0 && tasks.length > 0 && (
                <span className="text-emerald-700 dark:text-emerald-400">
                  {Math.round((done / tasks.length) * 100)}% done
                </span>
              )}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} className="mr-1" />
          New Task
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-sm text-zinc-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={32} />}
            title="No tasks yet"
            description="Create your first task to get started."
            action={
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus size={14} className="mr-1" />
                Create Task
              </Button>
            }
          />
        ) : (
          <KanbanBoard ref={scrollContainerRef} />
        )}
      </div>

      <HorizontalScrollBar containerRef={scrollContainerRef} />

      <QuickCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projectId={currentProject.id}
      />
    </div>
  );
}
