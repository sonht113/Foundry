import { ArrowLeft, Code2, HardDrive, Info, Monitor, Moon, PlugZap, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { useUIStore } from "../../stores/uiStore";

import { MCPSetupGuide } from "./MCPSetupGuide";

export function SettingsPage() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const [appVersion, setAppVersion] = useState("...");

  useEffect(() => {
    window.electronAPI?.getVersion?.().then((res) => {
      if (res?.version) setAppVersion(res.version);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <button
          onClick={() => setSettingsOpen(false)}
          className="cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-10 px-6 py-8">
          <section id="appearance">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              <Monitor size={16} className="text-indigo-500 dark:text-indigo-400" />
              Appearance
            </h2>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <label className="mb-3 block text-xs font-medium text-zinc-500">Theme</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all ${
                    theme === "dark"
                      ? "border-indigo-500 bg-indigo-600/10 text-indigo-600 dark:text-indigo-300"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-500"
                  }`}
                >
                  <Moon size={16} />
                  Dark
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all ${
                    theme === "light"
                      ? "border-indigo-500 bg-indigo-600/10 text-indigo-600 dark:text-indigo-300"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-500"
                  }`}
                >
                  <Sun size={16} />
                  Light
                </button>
              </div>
            </div>
          </section>

          <section id="database">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              <HardDrive size={16} className="text-indigo-500 dark:text-indigo-400" />
              Database
            </h2>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="text-xs text-zinc-500">
                SQLite stores data locally in your user directory. No credentials needed.
              </p>
            </div>
          </section>

          <section id="mcp">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              <PlugZap size={16} className="text-indigo-500 dark:text-indigo-400" />
              MCP Integration
            </h2>
            <p className="mb-4 text-xs leading-relaxed text-zinc-500">
              Connect AI agents like <strong>OpenCode</strong>, <strong>Claude Code</strong>, and{" "}
              <strong>Cursor</strong> to manage tasks programmatically via MCP.
            </p>
            <MCPSetupGuide />
          </section>

          <section id="about">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              <Info size={16} className="text-indigo-500 dark:text-indigo-400" />
              About
            </h2>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                  <HardDrive size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Foundry
                  </h3>
                  <p className="text-xs text-zinc-500">v{appVersion}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">
                AI-Native Task Manager. Built for both humans and AI agents as first-class citizens.
                Local-first, offline-capable, MCP-native.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  <Code2 size={12} />
                  GitHub
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
