import type { ReactNode } from "react";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-3 text-zinc-300 dark:text-zinc-700">{icon}</div>}
      <h3 className="text-sm font-medium text-zinc-400 dark:text-zinc-400 dark:text-zinc-600">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-zinc-400 dark:text-zinc-600">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
