export function formatSafeDate(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}
