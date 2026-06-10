export function formatSafeDate(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export function isTaskOverdue(task: { endDate: string | null; status: string }): boolean {
  if (!task.endDate || task.status === "done") return false;
  return new Date(task.endDate).getTime() < new Date().setHours(0, 0, 0, 0);
}
