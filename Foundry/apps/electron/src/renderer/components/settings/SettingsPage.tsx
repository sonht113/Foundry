import { ArrowLeft, Code2, Cloud, HardDrive, Info, Key, Link, Loader2, Monitor, Plug, PlugZap, Moon, Sun, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { useUIStore } from "../../stores/uiStore";

import { MCPSetupGuide } from "./MCPSetupGuide";

export function SettingsPage() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const dbBackend = useUIStore((s) => s.dbBackend);
  const [selectedBackend, setSelectedBackend] = useState<"supabase" | "sqlite">(dbBackend ?? "supabase");
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingChange, setPendingChange] = useState(false);
  const [dataDir, setDataDir] = useState("");

  useEffect(() => {
    window.electronAPI.config.get().then((cfg) => {
      if (cfg.database.databaseUrl) setDatabaseUrl(cfg.database.databaseUrl);
      if (cfg.database.supabaseUrl) setSupabaseUrl(cfg.database.supabaseUrl);
      if (cfg.database.supabaseKey) setSupabaseKey(cfg.database.supabaseKey);
      if (cfg.database.backend) setSelectedBackend(cfg.database.backend as "supabase" | "sqlite");
    }).catch(() => {});
  }, []);

  async function handleTest() {
    if (!databaseUrl) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await window.electronAPI.config.testConnection(databaseUrl);
      setTestResult(result);
    } catch (e) {
      setTestResult({ success: false, error: (e as Error).message });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (selectedBackend === "supabase" && !databaseUrl) return;
    setSaving(true);
    try {
      await window.electronAPI.config.setDatabase({
        backend: selectedBackend,
        databaseUrl: selectedBackend === "supabase" ? databaseUrl : undefined,
        supabaseUrl: supabaseUrl || undefined,
        supabaseKey: supabaseKey || undefined,
      });
      if (selectedBackend === "sqlite") {
        setDataDir("Restart to apply.");
      }
      setPendingChange(true);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  async function handleRestart() {
    await window.electronAPI.db.restartApp();
  }

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
              <Cloud size={16} className="text-indigo-500 dark:text-indigo-400" />
              Database Backend
            </h2>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <label className="mb-3 block text-xs font-medium text-zinc-500">
                Choose where your data is stored
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedBackend("supabase"); setTestResult(null); setPendingChange(false); }}
                  className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all ${
                    selectedBackend === "supabase"
                      ? "border-indigo-500 bg-indigo-600/10 text-indigo-600 dark:text-indigo-300"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-500"
                  }`}
                >
                  <Cloud size={16} />
                  Supabase
                </button>
                <button
                  onClick={() => { setSelectedBackend("sqlite"); setTestResult(null); setPendingChange(false); }}
                  className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all ${
                    selectedBackend === "sqlite"
                      ? "border-indigo-500 bg-indigo-600/10 text-indigo-600 dark:text-indigo-300"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-500"
                  }`}
                >
                  <HardDrive size={16} />
                  SQLite (Local)
                </button>
              </div>

              {selectedBackend === "supabase" && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      <Link size={12} className="mr-1 inline" />
                      Connection String (PG)
                    </label>
                    <input
                      type="text"
                      value={databaseUrl}
                      onChange={(e) => { setDatabaseUrl(e.target.value); setPendingChange(false); setTestResult(null); }}
                      placeholder="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"
                      className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      <Cloud size={12} className="mr-1 inline" />
                      Supabase URL (optional)
                    </label>
                    <input
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => { setSupabaseUrl(e.target.value); setPendingChange(false); setTestResult(null); }}
                      placeholder="https://your-project.supabase.co"
                      className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      <Key size={12} className="mr-1 inline" />
                      Anon Key (optional)
                    </label>
                    <input
                      type="text"
                      value={supabaseKey}
                      onChange={(e) => { setSupabaseKey(e.target.value); setPendingChange(false); setTestResult(null); }}
                      placeholder="sb_publishable_..."
                      className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  {testResult && (
                    <div
                      className={`rounded-md px-3 py-2 text-xs ${
                        testResult.success
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {testResult.success ? "Connection successful!" : `Failed: ${testResult.error}`}
                    </div>
                  )}

                  {pendingChange && (
                    <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Settings saved. Restart required to apply.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPendingChange(false)}
                          className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          Later
                        </button>
                        <button
                          onClick={handleRestart}
                          className="flex cursor-pointer items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-600"
                        >
                          <RotateCcw size={12} />
                          Restart Now
                        </button>
                      </div>
                    </div>
                  )}

                  {!pendingChange && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleTest}
                        disabled={testing || !databaseUrl}
                        className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        {testing ? <Loader2 size={12} className="animate-spin" /> : <Plug size={12} />}
                        Test Connection
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || !databaseUrl}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Cloud size={12} />}
                        Save
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedBackend === "sqlite" && (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-zinc-500">
                    SQLite stores data locally in your user directory. No credentials needed.
                    {dataDir && <span className="mt-1 block text-amber-500">{dataDir}</span>}
                  </p>
                  {pendingChange && (
                    <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Switched to SQLite. Restart required.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPendingChange(false)}
                          className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          Later
                        </button>
                        <button
                          onClick={handleRestart}
                          className="flex cursor-pointer items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-600"
                        >
                          <RotateCcw size={12} />
                          Restart Now
                        </button>
                      </div>
                    </div>
                  )}
                  {!pendingChange && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex cursor-pointer items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <HardDrive size={12} />}
                      Save
                    </button>
                  )}
                </div>
              )}
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
                  <p className="text-xs text-zinc-500">v0.1.0</p>
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
