import { Moon, Sun } from "lucide-react";

import { useUIStore } from "../../stores/uiStore";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const isDark = theme === "dark";
  const label = isDark ? "Dark mode" : "Light mode";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={collapsed ? label : undefined}
      className={
        collapsed
          ? "flex cursor-pointer items-center justify-center rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
          : "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-400 dark:text-zinc-500 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
      }
    >
      {isDark ? (
        <Moon size={14} className="text-indigo-400" />
      ) : (
        <Sun size={14} className="text-amber-400" />
      )}
      {!collapsed && <span>{label}</span>}
    </button>
  );
}
