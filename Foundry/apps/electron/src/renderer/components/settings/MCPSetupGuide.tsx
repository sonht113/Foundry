import { Check, Clipboard, Copy, Monitor, Terminal } from "lucide-react";
import { useMemo, useState } from "react";

import { useUIStore } from "../../stores/uiStore";

const DB_URL_PLACEHOLDER =
  "postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres";

type Platform = "win32" | "darwin" | "linux";

interface PlatformInfo {
  label: string;
  openCodeConfigPath: string;
  claudeConfigPath: string;
  claudeDesktopConfigPath: string;
  copilotConfigPath: string;
  windsurfConfigPath: string;
  runCommand: string;
}

const PLATFORMS: Record<Platform, PlatformInfo> = {
  win32: {
    label: "Windows",
    openCodeConfigPath: "%APPDATA%\\opencode\\opencode.jsonc",
    claudeConfigPath: "%APPDATA%\\Claude Code\\settings.json",
    claudeDesktopConfigPath: "%APPDATA%\\Claude\\claude_desktop_config.json",
    copilotConfigPath: "%USERPROFILE%\\.copilot\\mcp.json",
    windsurfConfigPath: "%APPDATA%\\windsurf\\mcp.json",
    runCommand: `set DATABASE_URL=${DB_URL_PLACEHOLDER} && node /absolute/path/to/Foundry/dist/mcp/server.js`,
  },
  darwin: {
    label: "macOS",
    openCodeConfigPath: "~/.config/opencode/opencode.jsonc",
    claudeConfigPath: "~/.claude/settings.json",
    claudeDesktopConfigPath: "~/Library/Application Support/Claude/claude_desktop_config.json",
    copilotConfigPath: "~/.copilot/mcp.json",
    windsurfConfigPath: "~/.windsurf/mcp.json",
    runCommand: `DATABASE_URL=${DB_URL_PLACEHOLDER} node /absolute/path/to/Foundry/dist/mcp/server.js`,
  },
  linux: {
    label: "Linux",
    openCodeConfigPath: "~/.config/opencode/opencode.jsonc",
    claudeConfigPath: "~/.claude/settings.json",
    claudeDesktopConfigPath: "~/.config/Claude/claude_desktop_config.json",
    copilotConfigPath: "~/.copilot/mcp.json",
    windsurfConfigPath: "~/.windsurf/mcp.json",
    runCommand: `DATABASE_URL=${DB_URL_PLACEHOLDER} node /absolute/path/to/Foundry/dist/mcp/server.js`,
  },
};

function getMCPConfig() {
  return {
    mcpServers: {
      foundry: {
        command: "node",
        args: ["/absolute/path/to/Foundry/dist/mcp/server.js"],
        env: {
          DATABASE_URL: DB_URL_PLACEHOLDER,
        },
      },
    },
  };
}

function detectPlatform(): Platform {
  const p = navigator.platform?.toLowerCase() ?? "";
  if (p.startsWith("win")) return "win32";
  if (p.startsWith("mac")) return "darwin";
  return "linux";
}

export function MCPSetupGuide() {
  const addToast = useUIStore((s) => s.addToast);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [platform, setPlatform] = useState<Platform>(detectPlatform);

  const info = PLATFORMS[platform];
  const config = useMemo(() => getMCPConfig(), []);
  const configStr = useMemo(() => JSON.stringify(config, null, 2), [config]);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      if (label === "config") setCopiedConfig(true);
      if (label === "url") setCopiedUrl(true);
      addToast(`Copied ${label} to clipboard`, "success");
      setTimeout(() => {
        if (label === "config") setCopiedConfig(false);
        if (label === "url") setCopiedUrl(false);
      }, 2000);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Platform</h3>
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900/50">
          {(Object.keys(PLATFORMS) as Platform[]).map((key) => (
            <button
              key={key}
              onClick={() => setPlatform(key)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                platform === key
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              <Monitor size={12} />
              {PLATFORMS[key].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">MCP Server</h3>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-500">
              Server runs on <span className="text-emerald-600 dark:text-emerald-400">stdio</span>{" "}
              transport via Supabase PostgreSQL
            </span>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
              Supabase Connection String
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                {DB_URL_PLACEHOLDER}
              </code>
              <button
                onClick={() => copyToClipboard(DB_URL_PLACEHOLDER, "url")}
                className="shrink-0 cursor-pointer rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                title="Copy connection string"
              >
                {copiedUrl ? (
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Clipboard size={14} />
                )}
              </button>
            </div>
            <p className="text-[10px] leading-relaxed text-zinc-400">
              Get your connection string from{" "}
              <strong>Supabase Dashboard → Project Settings → Database → Connection string</strong>.
              Replace <code className="text-[10px]">YOUR_PASSWORD</code> with your database password
              and <code className="text-[10px]">xxxxxxxxxxxxx</code> with your project ref.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Run MCP Server
        </h3>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-start gap-2">
            <Terminal size={14} className="mt-0.5 shrink-0 text-zinc-500" />
            <code className="flex-1 rounded-md bg-zinc-50 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              {info.runCommand}
            </code>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-zinc-400">
            Build first (<code className="text-[10px]">npm run build</code>), then replace{" "}
            <code className="text-[10px]">/absolute/path/to/Foundry</code> with your actual project
            path.
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          MCP Client Configuration
        </h3>
        <p className="mb-3 text-xs leading-relaxed text-zinc-500">
          Add this to your AI agent&apos;s MCP config to connect Foundry as a task management
          backend. Update the server path and{" "}
          <code className="text-[10px]">DATABASE_URL</code> before using.
        </p>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
              JSON Configuration
            </span>
            <button
              onClick={() => copyToClipboard(configStr, "config")}
              className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              {copiedConfig ? (
                <>
                  <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy size={12} /> Copy
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-300">
            {configStr}
          </pre>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Integration Guides
        </h3>
        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h4 className="mb-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              OpenCode
            </h4>
            <ol className="list-inside list-decimal space-y-1 text-xs text-zinc-500">
              <li>
                Create or edit{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  {info.openCodeConfigPath}
                </code>
              </li>
              <li>
                Paste the JSON configuration above into the{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  mcpServers
                </code>{" "}
                section
              </li>
              <li>Restart OpenCode</li>
            </ol>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h4 className="mb-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Claude Code
            </h4>
            <ol className="list-inside list-decimal space-y-1 text-xs text-zinc-500">
              <li>
                Edit{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  {info.claudeConfigPath}
                </code>
              </li>
              <li>
                Add the JSON configuration above under{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  mcpServers
                </code>
              </li>
              <li>Restart Claude Code</li>
            </ol>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h4 className="mb-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
              Claude Desktop
            </h4>
            <ol className="list-inside list-decimal space-y-1 text-xs text-zinc-500">
              <li>
                Create or edit{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  {info.claudeDesktopConfigPath}
                </code>
              </li>
              <li>
                Paste the JSON configuration above into the{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  mcpServers
                </code>{" "}
                section
              </li>
              <li>Restart Claude Desktop</li>
            </ol>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h4 className="mb-2 text-xs font-semibold text-blue-700 dark:text-blue-400">Cursor</h4>
            <ol className="list-inside list-decimal space-y-1 text-xs text-zinc-500">
              <li>
                Go to{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  Cursor Settings → MCP
                </code>
              </li>
              <li>
                Click <strong>Add new MCP server</strong>
              </li>
              <li>Paste the JSON configuration above</li>
              <li>The MCP server will auto-start on next command</li>
            </ol>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h4 className="mb-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              GitHub Copilot / Codex
            </h4>
            <ol className="list-inside list-decimal space-y-1 text-xs text-zinc-500">
              <li>
                Create or edit{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  {info.copilotConfigPath}
                </code>
              </li>
              <li>
                Paste the JSON configuration above into the{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  servers
                </code>{" "}
                section (Copilot uses <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">servers</code> instead of{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">mcpServers</code>)
              </li>
              <li>Restart Copilot</li>
            </ol>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h4 className="mb-2 text-xs font-semibold text-violet-600 dark:text-violet-400">
              Windsurf
            </h4>
            <ol className="list-inside list-decimal space-y-1 text-xs text-zinc-500">
              <li>
                Create or edit{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  {info.windsurfConfigPath}
                </code>
              </li>
              <li>
                Paste the JSON configuration above into the{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  mcpServers
                </code>{" "}
                section
              </li>
              <li>Restart Windsurf</li>
            </ol>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h4 className="mb-2 text-xs font-semibold text-zinc-500">Other MCP Clients</h4>
            <p className="text-xs text-zinc-500">
              Works with any MCP-compatible client that supports stdio transport. Copy the JSON
              configuration and paste it into your client&apos;s config.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
