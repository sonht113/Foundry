import { Moon, Sun } from "lucide-react";

import { useUIStore } from "../../stores/uiStore";

export function ThemeToggle() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <button
      onClick={toggleTheme}
      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-400 dark:text-zinc-500 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
    >
      {theme === "dark" ? (
        <Moon size={14} className="text-indigo-400" />
      ) : (
        <Sun size={14} className="text-amber-400" />
      )}
      <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
    </button>
  );
}
