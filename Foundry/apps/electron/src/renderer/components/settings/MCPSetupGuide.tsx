import { Check, Copy, Monitor } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useUIStore } from "../../stores/uiStore";

const DB_URL_PLACEHOLDER =
  "postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres";

type Platform = "win32" | "darwin" | "linux";
type Backend = "pglite" | "supabase";

interface PlatformInfo {
  label: string;
  openCodeConfigPath: string;
  claudeConfigPath: string;
  claudeDesktopConfigPath: string;
  copilotConfigPath: string;
  windsurfConfigPath: string;
}

const PLATFORMS: Record<Platform, PlatformInfo> = {
  win32: {
    label: "Windows",
    openCodeConfigPath: "%APPDATA%\\opencode\\opencode.jsonc",
    claudeConfigPath: "%APPDATA%\\Claude Code\\settings.json",
    claudeDesktopConfigPath: "%APPDATA%\\Claude\\claude_desktop_config.json",
    copilotConfigPath: "%USERPROFILE%\\.copilot\\mcp.json",
    windsurfConfigPath: "%APPDATA%\\windsurf\\mcp.json",
  },
  darwin: {
    label: "macOS",
    openCodeConfigPath: "~/.config/opencode/opencode.jsonc",
    claudeConfigPath: "~/.claude/settings.json",
    claudeDesktopConfigPath: "~/Library/Application Support/Claude/claude_desktop_config.json",
    copilotConfigPath: "~/.copilot/mcp.json",
    windsurfConfigPath: "~/.windsurf/mcp.json",
  },
  linux: {
    label: "Linux",
    openCodeConfigPath: "~/.config/opencode/opencode.jsonc",
    claudeConfigPath: "~/.claude/settings.json",
    claudeDesktopConfigPath: "~/.config/Claude/claude_desktop_config.json",
    copilotConfigPath: "~/.copilot/mcp.json",
    windsurfConfigPath: "~/.windsurf/mcp.json",
  },
};

interface McpServerConfig {
  serverPath: string;
  dataDir: string;
  nodePath: string;
  command: string[];
  environment: Record<string, string>;
}

interface BaseConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

function buildBaseConfig(mcp: McpServerConfig | null, backend: Backend): BaseConfig {
  const serverPath =
    mcp?.serverPath ?? "/absolute/path/to/Foundry/apps/mcp-server/dist/server.js";
  const dataDir = mcp?.dataDir ?? "./.pglite";
  const args = [serverPath];
  if (backend === "pglite") {
    args.push("--backend", "pglite");
  }
  const env: Record<string, string> = {};
  if (backend === "pglite") {
    env.PGLITE_DATA_DIR = dataDir;
  } else {
    env.DATABASE_URL = DB_URL_PLACEHOLDER;
  }
  if (mcp?.nodePath) {
    env.NODE_PATH = mcp.nodePath;
  }
  return { command: "node", args, env };
}

function toOpenCodeJson(base: BaseConfig): string {
  return JSON.stringify(
    {
      mcp: {
        foundry: {
          type: "local",
          command: [base.command, ...base.args],
          enabled: true,
          environment: base.env,
        },
      },
    },
    null,
    2
  );
}

function toStandardJson(base: BaseConfig): string {
  return JSON.stringify(
    {
      mcpServers: {
        foundry: {
          command: base.command,
          args: base.args,
          env: base.env,
        },
      },
    },
    null,
    2
  );
}

function toCopilotJson(base: BaseConfig): string {
  return JSON.stringify(
    {
      servers: {
        foundry: {
          command: base.command,
          args: base.args,
          env: base.env,
        },
      },
    },
    null,
    2
  );
}

function detectPlatform(): Platform {
  const p = navigator.platform?.toLowerCase() ?? "";
  if (p.startsWith("win")) return "win32";
  if (p.startsWith("mac")) return "darwin";
  return "linux";
}

export function MCPSetupGuide() {
  const addToast = useUIStore((s) => s.addToast);
  const [platform, setPlatform] = useState<Platform>(detectPlatform);
  const [backend, setBackend] = useState<Backend>("pglite");
  const [mcpConfig, setMcpConfig] = useState<McpServerConfig | null>(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const api = window.electronAPI as {
      mcp?: { getConfig: () => Promise<McpServerConfig> };
    } | undefined;
    api?.mcp
      ?.getConfig()
      .then((cfg: McpServerConfig) => setMcpConfig(cfg))
      .catch(() => {
        /* fallback to static defaults */
      });
  }, []);

  const info = PLATFORMS[platform];

  const baseConfig = useMemo(
    () => buildBaseConfig(mcpConfig, backend),
    [mcpConfig, backend]
  );

  const openCodeConfigStr = useMemo(() => toOpenCodeJson(baseConfig), [baseConfig]);
  const standardConfigStr = useMemo(() => toStandardJson(baseConfig), [baseConfig]);
  const copilotConfigStr = useMemo(() => toCopilotJson(baseConfig), [baseConfig]);

  const serverPath = mcpConfig?.serverPath ?? "...";
  const dataDir = mcpConfig?.dataDir ?? "...";

  function copyConfig(key: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      addToast("Copied configuration to clipboard", "success");
      setTimeout(() => setCopied(""), 2000);
    });
  }

  const standardPreview =
    backend === "pglite"
      ? "PGlite — local database, no Supabase required"
      : "Supabase — set DATABASE_URL with your connection string";

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
        <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Server Info
        </h3>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-500">
              stdio transport — supports both backends
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                Server Path
              </label>
              <code className="mt-1 block truncate rounded-md bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                {serverPath}
              </code>
            </div>
            <div>
              <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                PGlite Data Directory
              </label>
              <code className="mt-1 block truncate rounded-md bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                {dataDir}
              </code>
            </div>
            {mcpConfig?.nodePath ? (
              <div>
                <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                  Node Modules Path (for installed app)
                </label>
                <code className="mt-1 block truncate rounded-md bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                  {mcpConfig.nodePath}
                </code>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Backend</h3>
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            onClick={() => setBackend("pglite")}
            className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              backend === "pglite"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            PGlite (Local)
          </button>
          <button
            onClick={() => setBackend("supabase")}
            className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              backend === "supabase"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            Supabase (Cloud)
          </button>
        </div>
        {backend === "supabase" ? (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <label className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
              Supabase Connection String
            </label>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                {DB_URL_PLACEHOLDER}
              </code>
              <button
                onClick={() => copyConfig("url", DB_URL_PLACEHOLDER)}
                className="shrink-0 cursor-pointer rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                title="Copy connection string"
              >
                {copied === "url" ? (
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-zinc-400">
              Get your string from{" "}
              <strong>Supabase Dashboard → Settings → Database → Connection string</strong>. Replace{" "}
              <code className="text-[10px]">YOUR_PASSWORD</code> and{" "}
              <code className="text-[10px]">xxxxxxxxxxxxx</code>.
            </p>
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Config Preview
        </h3>
        <p className="mb-2 text-xs text-zinc-500">{standardPreview}</p>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
              Standard Format (mcpServers)
            </span>
            <button
              onClick={() => copyConfig("preview", standardConfigStr)}
              className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              {copied === "preview" ? (
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
            {standardConfigStr}
          </pre>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Integration Guides
        </h3>
        <p className="mb-3 text-xs leading-relaxed text-zinc-500">
          Each client uses a different config format. Click its copy button to get the correct JSON.
        </p>
        <div className="space-y-3">
          <ClientGuideCard
            name="OpenCode"
            color="text-indigo-600 dark:text-indigo-400"
            configPath={info.openCodeConfigPath}
            configKey="mcp"
            notes='Uses <code class="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[10px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">type: "local"</code> and <code class="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[10px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">environment</code> format. Or use <code class="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[10px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">opencode.json</code> in project root.'
            copied={copied === "opencode"}
            onCopy={() => copyConfig("opencode", openCodeConfigStr)}
          />

          <ClientGuideCard
            name="Claude Code"
            color="text-amber-600 dark:text-amber-400"
            configPath={info.claudeConfigPath}
            configKey="mcpServers"
            copied={copied === "claude-code"}
            onCopy={() => copyConfig("claude-code", standardConfigStr)}
          />

          <ClientGuideCard
            name="Claude Desktop"
            color="text-amber-700 dark:text-amber-300"
            configPath={info.claudeDesktopConfigPath}
            configKey="mcpServers"
            copied={copied === "claude-desktop"}
            onCopy={() => copyConfig("claude-desktop", standardConfigStr)}
          />

          <ClientGuideCard
            name="Cursor"
            color="text-blue-700 dark:text-blue-400"
            configPath={
              platform === "darwin"
                ? "Cursor Settings → MCP → Add new MCP server"
                : "Cursor Settings → MCP (or .cursor/mcp.json)"
            }
            configKey="mcpServers"
            copied={copied === "cursor"}
            onCopy={() => copyConfig("cursor", standardConfigStr)}
          />

          <ClientGuideCard
            name="GitHub Copilot / Codex"
            color="text-emerald-600 dark:text-emerald-400"
            configPath={info.copilotConfigPath}
            configKey="servers"
            notes='Uses <code class="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[10px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">"servers"</code> key (<strong>not</strong> <code class="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[10px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">"mcpServers"</code>).'
            copied={copied === "copilot"}
            onCopy={() => copyConfig("copilot", copilotConfigStr)}
          />

          <ClientGuideCard
            name="Windsurf"
            color="text-violet-600 dark:text-violet-400"
            configPath={info.windsurfConfigPath}
            configKey="mcpServers"
            copied={copied === "windsurf"}
            onCopy={() => copyConfig("windsurf", standardConfigStr)}
          />

          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h4 className="mb-2 text-xs font-semibold text-zinc-500">Other MCP Clients</h4>
            <p className="text-xs text-zinc-500">
              Works with any MCP-compatible client that supports stdio transport. Copy the Standard
              Format config above and paste it into your client&apos;s{" "}
              <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[10px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                mcpServers
              </code>{" "}
              section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientGuideCard({
  name,
  color,
  configPath,
  configKey,
  notes,
  copied,
  onCopy,
}: {
  name: string;
  color: string;
  configPath: string;
  configKey: string;
  notes?: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mb-2 flex items-center justify-between">
        <h4 className={`text-xs font-semibold ${color}`}>{name}</h4>
        <button
          onClick={onCopy}
          className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> Copied
            </>
          ) : (
            <>
              <Copy size={12} /> Copy Config
            </>
          )}
        </button>
      </div>
      <ol className="list-inside list-decimal space-y-1 text-xs text-zinc-500">
        <li>
          Create or edit{" "}
          <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
            {configPath}
          </code>
        </li>
        <li>
          Paste the configuration under the{" "}
          <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
            {configKey}
          </code>{" "}
          key
        </li>
        <li>Restart {name}</li>
      </ol>
      {notes ? (
        <p
          className="mt-2 text-[10px] leading-relaxed text-zinc-400"
          dangerouslySetInnerHTML={{ __html: notes }}
        />
      ) : null}
    </div>
  );
}
