import fs from "fs";
import { execSync } from "node:child_process";

import { BrowserWindow, ipcMain } from "electron";
import type { IPty } from "node-pty";
import { spawn } from "node-pty";

let pty: IPty | null = null;
let mainWindow: BrowserWindow | null = null;
let currentShellPath: string | null = null;

interface ShellOption {
  id: string;
  name: string;
  path: string;
}

function createShell(shellPath: string) {
  const isWin = process.platform === "win32";
  const homeDir = isWin
    ? process.env.USERPROFILE || process.cwd()
    : process.env.HOME || process.cwd();

  const shellName = shellPath.split(/[/\\]/).pop()?.toLowerCase() || "";

  // Determine args: login shell for zsh/bash to source .zshrc/.bashrc
  let args: string[] = [];
  if (shellName === "zsh" || shellName === "bash") {
    args = ["-l"];
  }

  // Build env with proper terminal type so tools like oh-my-posh/starship detect correctly
  const env: Record<string, string> = {
    TERM: "xterm-256color",
    TERM_PROGRAM: "foundry-terminal",
    ...(process.env as Record<string, string>),
  };

  const newPty = spawn(shellPath, args, {
    name: "xterm-256color",
    cols: 120,
    rows: 30,
    cwd: homeDir,
    env,
  });

  currentShellPath = shellPath;
  pty = newPty;

  newPty.onData((data: string) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("terminal:data", data);
    }
  });

  newPty.onExit(({ exitCode }: { exitCode: number; signal?: number }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("terminal:exit", exitCode);
    }
    if (pty === newPty) {
      pty = null;
      currentShellPath = null;
    }
  });

  return newPty;
}

function killCurrentPty() {
  if (pty) {
    try {
      pty.kill();
    } catch {
      // ignore
    }
    pty = null;
    currentShellPath = null;
  }
}

function getAvailableShells(): ShellOption[] {
  const shells: ShellOption[] = [];
  const isWin = process.platform === "win32";

  if (isWin) {
    // Command Prompt
    const cmdPath = process.env.COMSPEC || "cmd.exe";
    if (cmdPath) {
      shells.push({ id: "cmd", name: "Command Prompt", path: cmdPath });
    }

    // PowerShell 5
    const systemRoot = process.env.SystemRoot || process.env.windir || "C:\\Windows";
    const ps5Path = `${systemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
    if (fs.existsSync(ps5Path)) {
      shells.push({ id: "powershell", name: "PowerShell", path: ps5Path });
    }

    // PowerShell 7 (Core)
    try {
      const pwsh = execSync("where pwsh 2>nul", {
        encoding: "utf8",
        shell: "cmd.exe",
      })
        .trim()
        .split("\n")[0]
        ?.trim();

      if (pwsh && fs.existsSync(pwsh)) {
        shells.push({ id: "pwsh", name: "PowerShell 7", path: pwsh });
      }
    } catch {
      // pwsh not installed
    }
  } else {
    try {
      const content = fs.readFileSync("/etc/shells", "utf8");
      const lines = content
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));

      for (const path of lines) {
        const name = path.split("/").pop() || path;
        if (fs.existsSync(path)) {
          shells.push({
            id: name,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            path,
          });
        }
      }
    } catch {
      const sh = process.env.SHELL;
      if (sh) {
        const name = sh.split("/").pop() || "shell";
        shells.push({
          id: "shell",
          name: name.charAt(0).toUpperCase() + name.slice(1),
          path: sh,
        });
      }
    }
  }

  return shells;
}

function getDefaultShell(): string {
  const isWin = process.platform === "win32";
  return isWin
    ? process.env.COMSPEC || "cmd.exe"
    : process.env.SHELL || "bash";
}

export function registerTerminalHandlers(win: BrowserWindow): void {
  mainWindow = win;

  ipcMain.handle("terminal:getShells", async () => {
    return { shells: getAvailableShells() };
  });

  ipcMain.handle("terminal:spawn", async (_event, shellPath?: string) => {
    try {
      killCurrentPty();
      const targetShell = shellPath || getDefaultShell();
      createShell(targetShell);
      return { success: true, shellPath: targetShell };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle("terminal:getCurrentShell", async () => {
    return { shellPath: currentShellPath };
  });

  ipcMain.handle("terminal:isAlive", async () => {
    return { alive: pty !== null };
  });

  ipcMain.handle("terminal:write", async (_event, data: string) => {
    pty?.write(data);
    return { success: true };
  });

  ipcMain.handle("terminal:resize", async (_event, cols: number, rows: number) => {
    if (pty) {
      try {
        pty.resize(cols, rows);
      } catch {
        // ignore resize errors
      }
    }
    return { success: true };
  });

  ipcMain.handle("terminal:kill", async () => {
    killCurrentPty();
    return { success: true };
  });
}
