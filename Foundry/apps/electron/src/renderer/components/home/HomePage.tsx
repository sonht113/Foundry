import { Bot, Command, HardDrive, Keyboard, LayoutDashboard, Sparkles } from "lucide-react";

import { AppLogo } from "../common/AppLogo";

import { KanbanThumbnail } from "./KanbanThumbnail";

const features = [
  {
    icon: <LayoutDashboard size={18} />,
    title: "Kanban Boards",
    desc: "Drag-and-drop columns and tasks with customizable workflows.",
  },
  {
    icon: <Bot size={18} />,
    title: "AI-Native",
    desc: "Full MCP server — AI agents interact directly with your tasks.",
  },
  {
    icon: <Keyboard size={18} />,
    title: "Keyboard-First",
    desc: "Cmd+K search, Cmd+1–4 status moves, and quick shortcuts everywhere.",
  },
  {
    icon: <HardDrive size={18} />,
    title: "Local-First",
    desc: "All data in local SQLite. Works offline. Your data stays yours.",
  },
];

export function HomePage() {
  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto p-8">
      <div className="flex w-full max-w-2xl flex-col items-center gap-10 py-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative">
            <div className="absolute inset-0 scale-150 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-400/10" />
            <AppLogo size={56} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Foundry
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              An AI-native task manager where humans and AI agents collaborate seamlessly through a
              shared workspace.
            </p>
          </div>
        </div>

        <KanbanThumbnail />

        <div className="grid w-full grid-cols-2 gap-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                {f.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {f.title}
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex w-full flex-col items-center gap-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-5 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Ready to get started?
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Select a project from the sidebar or create a new one to begin organizing your work.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[
              { keys: ["Cmd", "N"], label: "New Task" },
              { keys: ["Cmd", "K"], label: "Search" },
              { keys: ["Cmd", "1-4"], label: "Change Status" },
            ].map(({ keys, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-md bg-zinc-200/60 px-2.5 py-1 text-[11px] dark:bg-zinc-800/60"
              >
                <span className="flex items-center gap-0.5 font-medium text-zinc-600 dark:text-zinc-400">
                  {keys.map((k, i) => (
                    <span key={k}>
                      {i > 0 && <span className="text-zinc-400 dark:text-zinc-600">+</span>}
                      <kbd className="rounded bg-white px-1 py-0.5 text-[10px] shadow-sm dark:bg-zinc-700 dark:text-zinc-300">
                        {k}
                      </kbd>
                    </span>
                  ))}
                </span>
                <span className="text-zinc-500 dark:text-zinc-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
          <Command size={10} className="mr-1 inline-block" />
          Press Cmd+K to search tasks, Cmd+N to create a new task
        </p>
      </div>
    </div>
  );
}
