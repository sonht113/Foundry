import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, CalendarDays, Clock, User } from "lucide-react";

import { TASK_PRIORITY_LABELS, PRIORITY_COLORS } from "../../lib/constants";
import { formatSafeDate, isTaskOverdue } from "../../lib/formatDate";

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

interface CardProps {
  task: Task;
  isOverlay?: boolean;
}

export function TaskCard({ task, isOverlay }: CardProps) {
  const colors = PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] ?? PRIORITY_COLORS.low;
  const hasDates = task.startDate || task.endDate;
  const hasAssignee = !!task.assignee;
  const overdue = isTaskOverdue(task);

  return (
    <div
      className={`rounded-lg border bg-white p-3 dark:bg-zinc-900 ${
        isOverlay
          ? "border-zinc-400 shadow-xl dark:border-zinc-600"
          : `border-zinc-200 border-l-2 ${overdue ? "border-l-red-500" : colors.border} cursor-grab active:cursor-grabbing`
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text}`}>
          {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] ?? task.priority}
        </span>
        {hasAssignee && (
          <span className="min-w-0 truncate text-[10px] text-zinc-400 dark:text-zinc-500">
            <User size={10} className="mr-0.5 inline -translate-y-px" />
            {task.assignee}
          </span>
        )}
      </div>

      <p className="mt-1.5 text-sm leading-snug font-medium text-zinc-800 dark:text-zinc-100">
        {task.title}
      </p>

      {(hasDates || task.estimateHours > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px]">
          {hasDates && (
            <span className={`flex items-center gap-1 ${overdue ? "text-red-500 dark:text-red-400 font-semibold" : "text-zinc-400 dark:text-zinc-500"}`}>
              {overdue ? <AlertTriangle size={11} /> : <CalendarDays size={11} />}
              {formatSafeDate(task.startDate)} {task.startDate && task.endDate ? "→" : ""} {formatSafeDate(task.endDate)}
            </span>
          )}
          {task.estimateHours > 0 && (
            <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
              <Clock size={11} />
              {task.estimateHours}h
            </span>
          )}
        </div>
      )}
      {overdue && (
        <div className="mt-1.5">
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
            Overdue
          </span>
        </div>
      )}
    </div>
  );
}

interface SortableProps {
  task: Task;
  onClick: () => void;
}

export function SortableTaskCard({ task, onClick }: SortableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const colors = PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] ?? PRIORITY_COLORS.low;
  const hasDates = task.startDate || task.endDate;
  const hasAssignee = !!task.assignee;
  const overdue = isTaskOverdue(task);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}>
      <div className={`cursor-pointer rounded-lg border border-l-2 border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 ${overdue ? "border-l-red-500" : colors.border}`}>
        <div className="flex items-center justify-between gap-2">
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text}`}>
            {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] ?? task.priority}
          </span>
          {hasAssignee && (
            <span className="min-w-0 truncate text-[10px] text-zinc-400 dark:text-zinc-500">
              <User size={10} className="mr-0.5 inline -translate-y-px" />
              {task.assignee}
            </span>
          )}
        </div>

        <p className="mt-1.5 text-sm leading-snug font-medium text-zinc-800 dark:text-zinc-100">
          {task.title}
        </p>

        {(hasDates || task.estimateHours > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px]">
            {hasDates && (
              <span className={`flex items-center gap-1 ${overdue ? "text-red-500 dark:text-red-400 font-semibold" : "text-zinc-400 dark:text-zinc-500"}`}>
                {overdue ? <AlertTriangle size={11} /> : <CalendarDays size={11} />}
                {formatSafeDate(task.startDate)} {task.startDate && task.endDate ? "→" : ""} {formatSafeDate(task.endDate)}
              </span>
            )}
            {task.estimateHours > 0 && (
              <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                <Clock size={11} />
                {task.estimateHours}h
              </span>
            )}
          </div>
        )}
        {overdue && (
          <div className="mt-1.5">
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
              Overdue
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
