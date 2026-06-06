import "@xterm/xterm/css/xterm.css";

import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { ChevronDown, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useUIStore } from "../../stores/uiStore";
import type { ShellOption } from "../../types";

async function spawnShell(term: Terminal, shellPath?: string): Promise<string | null> {
  const result = await window.electronAPI.terminal.spawn(shellPath);
  if (!result.success) {
    term.writeln(`\r\n\x1b[31m>> Spawn failed: ${result.error ?? "unknown"}\x1b[0m`);
    return null;
  }
  return result.shellPath ?? null;
}

async function tryRespawn(term: Terminal, delayMs: number): Promise<string | null> {
  await new Promise((r) => setTimeout(r, delayMs));
  return spawnShell(term);
}

export function TerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const mountedRef = useRef(true);
  const respawningRef = useRef(false);
  const selectedShellRef = useRef<string | null>(null);
  const toggleTerminal = useUIStore((s) => s.toggleTerminal);

  const [shells, setShells] = useState<ShellOption[]>([]);
  const [selectedShellId, setSelectedShellId] = useState<string>("");

  const handleResize = useCallback(() => {
    if (!fitAddonRef.current) return;
    fitAddonRef.current.fit();
    const dims = fitAddonRef.current.proposeDimensions();
    if (dims) {
      window.electronAPI.terminal.resize(dims.cols, dims.rows);
    }
  }, []);

  const switchShell = useCallback(
    async (shellId: string) => {
      setSelectedShellId(shellId);
      const shell = shells.find((s) => s.id === shellId);
      if (!shell || !termRef.current) return;

      selectedShellRef.current = shell.path;
      const shellPath = await spawnShell(termRef.current, shell.path);
      if (shellPath) {
        setTimeout(() => handleResize(), 100);
      }
    },
    [shells, handleResize],
  );

  useEffect(() => {
    window.electronAPI.terminal.getShells().then((result) => {
      if (result.shells.length > 0) {
        setShells(result.shells);
        setSelectedShellId(result.shells[0].id);
        selectedShellRef.current = result.shells[0].path;
      }
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      fontSize: 14,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    fitAddon.fit();

    term.onData((data) => {
      window.electronAPI.terminal.write(data);
    });

    window.electronAPI.terminal.onData((data: string) => {
      try {
        term.write(data);
      } catch {
        // terminal may be disposed
      }
    });

    window.electronAPI.terminal.onExit(() => {
      if (!mountedRef.current) return;
      if (respawningRef.current) return;

      respawningRef.current = true;
      term.writeln("\r\n\x1b[33m>> Shell exited. Respawning...\x1b[0m");
      tryRespawn(term, 1000).then((shellPath) => {
        if (shellPath) {
          setTimeout(() => handleResize(), 100);
        } else if (mountedRef.current) {
          term.writeln("\x1b[31m>> Failed to respawn. Close & reopen terminal to try again.\x1b[0m");
        }
        respawningRef.current = false;
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Defer spawn until shells are loaded
    const spawnTimer = setTimeout(() => {
      const path = selectedShellRef.current;
      if (path) {
        spawnShell(term, path).then((shellPath) => {
          if (shellPath) {
            setTimeout(() => handleResize(), 100);
          }
        });
      }
    }, 100);

    return () => {
      clearTimeout(spawnTimer);
      mountedRef.current = false;
      resizeObserver.disconnect();
      window.electronAPI.terminal.removeAllListeners();
      window.electronAPI.terminal.kill();
      term.dispose();
    };
  }, [handleResize]);

  const selectedShellName = shells.find((s) => s.id === selectedShellId)?.name || "Shell";

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-1.5">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-emerald-400" />
          <span className="text-xs text-zinc-400">Workspace Terminal</span>
          {shells.length > 1 && (
            <div className="relative">
              <select
                value={selectedShellId}
                onChange={(e) => switchShell(e.target.value)}
                className="cursor-pointer appearance-none rounded bg-zinc-800 py-0.5 pl-2 pr-6 text-[11px] text-zinc-300 outline-none ring-0 hover:bg-zinc-700 focus:bg-zinc-700"
              >
                {shells.map((shell) => (
                  <option key={shell.id} value={shell.id}>
                    {shell.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={10}
                className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
            </div>
          )}
          {shells.length <= 1 && (
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
              {selectedShellName}
            </span>
          )}
        </div>
        <button
          onClick={toggleTerminal}
          className="cursor-pointer rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          <X size={14} />
        </button>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 p-0 overflow-hidden" />
    </div>
  );
}
