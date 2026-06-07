import { Cloud, HardDrive, Key, Link, Loader2, Plug, RotateCcw } from "lucide-react";
import { useState } from "react";

import { useUIStore } from "../../stores/uiStore";

interface Props {
  onConnected: (backend: "supabase" | "pglite") => void;
}

type SetupStep = "choose" | "supabase" | "pglite";

export function ConnectionDialog({ onConnected }: Props) {
  const [step, setStep] = useState<SetupStep>("choose");
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const setDbBackend = useUIStore((s) => s.setDbBackend);

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

  async function handleSaveSupabase() {
    if (!databaseUrl) return;
    setSaving(true);
    try {
      await window.electronAPI.config.setDatabase({
        backend: "supabase",
        databaseUrl,
        supabaseUrl: supabaseUrl || undefined,
        supabaseKey: supabaseKey || undefined,
      });
      setDbBackend("supabase");
      onConnected("supabase");
    } catch {
      setSaving(false);
    }
  }

  async function handleSavePGlite() {
    setSaving(true);
    try {
      await window.electronAPI.config.setDatabase({ backend: "pglite" });
      setDbBackend("pglite");
      onConnected("pglite");
    } catch {
      setSaving(false);
    }
  }

  function handleBack() {
    setStep("choose");
    setTestResult(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm">
      {step === "choose" && (
        <div className="mx-4 w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-1 flex items-center gap-2">
            <HardDrive size={20} className="text-indigo-500" />
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Foundry</h1>
          </div>
          <p className="mb-6 text-xs text-zinc-500">AI-Native Task Manager — choose your database</p>

          <button
            onClick={() => setStep("supabase")}
            className="mb-2 flex w-full cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-left transition-colors hover:border-indigo-500/50 hover:bg-indigo-50 dark:border-zinc-700 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/5"
          >
            <Cloud size={20} className="text-indigo-500" />
            <div>
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Supabase</div>
              <div className="text-xs text-zinc-500">Cloud-hosted PostgreSQL — shared across devices</div>
            </div>
          </button>

          <button
            onClick={handleSavePGlite}
            disabled={saving}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-left transition-colors hover:border-emerald-500/50 hover:bg-emerald-50 dark:border-zinc-700 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/5"
          >
            {saving ? (
              <Loader2 size={20} className="animate-spin text-emerald-500" />
            ) : (
              <HardDrive size={20} className="text-emerald-500" />
            )}
            <div>
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">PGlite</div>
              <div className="text-xs text-zinc-500">Local embedded PostgreSQL — works offline</div>
            </div>
          </button>
        </div>
      )}

      {step === "supabase" && (
        <div className="mx-4 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={handleBack}
              className="cursor-pointer rounded p-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <RotateCcw size={14} />
            </button>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Supabase Connection</h2>
          </div>

          <p className="mb-4 text-xs leading-relaxed text-zinc-500">
            Enter your Supabase project credentials. Get them from{" "}
            <strong>Supabase Dashboard → Settings → Database</strong>.
          </p>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <Link size={12} className="mr-1 inline" />
                Connection String (PG)
              </label>
              <input
                type="text"
                value={databaseUrl}
                onChange={(e) => setDatabaseUrl(e.target.value)}
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
                onChange={(e) => setSupabaseUrl(e.target.value)}
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
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="sb_publishable_..."
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {testResult && (
            <div
              className={`mt-3 rounded-md px-3 py-2 text-xs ${
                testResult.success
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {testResult.success ? "Connection successful!" : `Failed: ${testResult.error}`}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleTest}
              disabled={testing || !databaseUrl}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {testing ? <Loader2 size={12} className="animate-spin" /> : <Plug size={12} />}
              Test Connection
            </button>
            <button
              onClick={handleSaveSupabase}
              disabled={saving || !databaseUrl}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Cloud size={12} />}
                    Connect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
