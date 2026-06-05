export type TaskPriority = "low" | "medium" | "high" | "critical";

export const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "critical"];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-red-500", text: "text-white", border: "border-l-red-500" },
  high: { bg: "bg-orange-500", text: "text-white", border: "border-l-orange-500" },
  medium: { bg: "bg-blue-500", text: "text-white", border: "border-l-blue-500" },
  low: { bg: "bg-zinc-400", text: "text-white", border: "border-l-zinc-400" },
};
