import { HardDrive, Loader2 } from "lucide-react";
import { useState } from "react";

import { useUIStore } from "../../stores/uiStore";

interface Props {
  onConnected: (backend: "sqlite") => void;
}

export function ConnectionDialog({ onConnected }: Props) {
  const [saving, setSaving] = useState(false);
  const setDbBackend = useUIStore((s) => s.setDbBackend);

  async function handleSaveSqlite() {
    setSaving(true);
    try {
      await window.electronAPI.config.setDatabase({ backend: "sqlite" });
      setDbBackend("sqlite");
      onConnected("sqlite");
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-1 flex items-center gap-2">
          <HardDrive size={20} className="text-indigo-500" />
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Foundry</h1>
        </div>
        <p className="mb-6 text-xs text-zinc-500">AI-Native Task Manager — local SQLite database</p>

        <button
          onClick={handleSaveSqlite}
          disabled={saving}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-left transition-colors hover:border-emerald-500/50 hover:bg-emerald-50 dark:border-zinc-700 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/5"
        >
          {saving ? (
            <Loader2 size={20} className="animate-spin text-emerald-500" />
          ) : (
            <HardDrive size={20} className="text-emerald-500" />
          )}
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Get Started</div>
            <div className="text-xs text-zinc-500">Local SQLite database — persisted to disk</div>
          </div>
        </button>
      </div>
    </div>
  );
}
