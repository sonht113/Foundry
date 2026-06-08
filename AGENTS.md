# AGENTS.md — AI-Native Task Manager

## Project State
Development — Phase 3 (AI Roadmap Generator). Code lives in `Foundry/`.
Two reference docs define the plan:
- `AI_NATIVE_TASK_MANAGER_PRD.md` — product requirements, scope, vision
- `AI_NATIVE_TASK_MANAGER_TECHNICAL_DESIGN.md` — architecture, DB schema, flows, component tree, MCP protocol

## Core Concept
AI-native task manager where **both humans (UI) and AI agents (MCP) are first-class citizens**. Built on SQLite (sql.js) accessed through the same service layer.

## Stack
| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron |
| UI | React 19 + TypeScript + Vite + TailwindCSS 4 |
| State | Zustand 5 |
| DB | SQLite (sql.js) — raw SQL via pool.query |
| MCP | @modelcontextprotocol/sdk |
| Drag-drop | dnd-kit |
| Packaging | electron-builder |
| Lint/format | ESLint 9 + Prettier 3 |
| Import alias | @/ (tsc-alias for main, Vite for renderer) |

## Key Architecture Decisions
- **Local-first**: SQLite (sql.js) as the database backend — fully offline, no cloud required
- **Process model**: Electron main process hosts services; renderer talks via IPC (contextBridge); MCP server runs as stdio child process
- **Database**: Data persisted to disk automatically. Default path:
  - Windows: `%APPDATA%\Foundry\foundry.db`
  - macOS: `~/Library/Application Support/Foundry/foundry.db`
  - Linux: `~/.local/share/Foundry/foundry.db`
- **Offline**: fully supported; no network connectivity required
- **ID format**: nanoid with prefixes (`proj_`, `task_`, `tag_`, `note_`, `hist_`)
- **Error handling**: Zod validation + custom `AppError` hierarchy + Zustand error states + toast notifications

## Environment Setup
No environment variables required — SQLite database auto-creates at the default path.

Optionally override with `SQLITE_DATA_DIR` to use a custom database file path:
```bash
SQLITE_DATA_DIR=/custom/path/to/foundry.db
```

## Commands (run from Foundry/)
```bash
npm run dev           # Vite + Electron dev mode
npm run build         # Production build (Vite + tsc + tsc-alias)
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix + import sorting
npm run format        # Prettier format
npm run typecheck     # TypeScript check (needs NODE_OPTIONS="--max-old-space-size=4096")
npm run mcp-server    # Start MCP server
```

### Packaging (run from Foundry/apps/electron/)
```bash
npm run pack:win      # Windows NSIS installer
npm run pack:mac      # macOS DMG (requires macOS host)
npm run pack:linux    # Linux AppImage
npm run pack:all      # All platforms at once
```
Output: `apps/electron/dist/installers/`

## MCP Server (Phase 2)
The MCP server exposes 28 tools via stdio transport:
- **Project**: list_projects, get_project, create_project, update_project, delete_project, archive_project, unarchive_project
- **Task**: list_tasks, get_task, create_task, update_task, delete_task, move_task, search_tasks
- **Tag**: list_tags, create_tag, delete_tag
- **Note**: list_notes, create_note, update_note, delete_note
- **Column**: list_columns, create_column, delete_column, reorder_columns
- **AI**: analyze_project, generate_tasks_from_prompt, breakdown_task

### MCP Client Integration

The Foundry MCP server uses **stdio transport** with **SQLite** backend.

> **Development vs Installed:** In development (source checkout), the server path is `apps/mcp-server/dist/server.js`.
> When Foundry is installed as a packaged app, the MCP server is bundled at `resources/mcp-server/server.js`
> and dependencies are at `resources/app/node_modules`. Open the app and go to
> **Settings → MCP Server** to see and copy the exact config with correct paths for your environment.

**Development (source checkout):**
```json
{
  "mcpServers": {
    "foundry": {
      "command": "node",
      "args": ["/absolute/path/to/Foundry/apps/mcp-server/dist/server.js"]
    }
  }
}
```

Optionally set a custom SQLite path:
```json
{
  "mcpServers": {
    "foundry": {
      "command": "node",
      "args": ["/absolute/path/to/Foundry/apps/mcp-server/dist/server.js"],
      "env": {
        "SQLITE_DATA_DIR": "/path/to/foundry.db"
      }
    }
  }
}
```

**Installed (Windows example):**
```json
{
  "mcpServers": {
    "foundry": {
      "command": "node",
      "args": [
        "C:\\Program Files\\Foundry\\resources\\mcp-server\\server.js"
      ],
      "env": {
        "NODE_PATH": "C:\\Program Files\\Foundry\\resources\\app\\node_modules"
      }
    }
  }
}
```
> Paths vary by OS and install location. Always use the config from **Settings → MCP Server**.

Build first: `npm run build` (from `Foundry/` — uses Turbo to build all packages including `@foundry/mcp-server`). Replace `/absolute/path/to/Foundry` with your actual project path.

---

#### 1. OpenCode

| Level | Config File |
|-------|-------------|
| Project | `opencode.json` (project root) |
| Global | `~/.config/opencode/opencode.json` (macOS/Linux) or `%APPDATA%\opencode\opencode.json` (Windows) |

Paste the config under the `mcp` key. Format uses `type: "local"`, `command` as array:

```json
{
  "mcp": {
    "foundry": {
      "type": "local",
      "command": [
        "node",
        "/absolute/path/to/Foundry/apps/mcp-server/dist/server.js"
      ],
      "enabled": true
    }
  }
}
```

Restart OpenCode.

> For installed Foundry, use **Settings → MCP Server** for exact paths.

---

#### 2. Claude Code (CLI)

| Platform | Config File |
|----------|-------------|
| Windows  | `%APPDATA%\Claude Code\settings.json` |
| macOS    | `~/.claude/settings.json` |
| Linux    | `~/.claude/settings.json` |

Paste the config into the `mcpServers` section. Restart Claude Code.

---

#### 3. Claude Desktop

| Platform | Config File |
|----------|-------------|
| Windows  | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS    | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux    | `~/.config/Claude/claude_desktop_config.json` |

Paste the config into `mcpServers`. Restart Claude Desktop.

---

#### 4. Cursor

Cursor uses a UI-based MCP config:
1. Go to **Cursor Settings → MCP** (or **File → Preferences → Cursor Settings → MCP**)
2. Click **Add new MCP server**
3. Paste the JSON config (the top-level `foundry` object — name it `foundry` as the server name)
4. The server auto-starts on the next command

Alternatively, create a project-level `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "foundry": {
      "command": "node",
      "args": ["/absolute/path/to/Foundry/apps/mcp-server/dist/server.js"]
    }
  }
}
```

---

#### 5. GitHub Copilot / Codex

| Platform | Config File |
|----------|-------------|
| Windows  | `%USERPROFILE%\.copilot\mcp.json` |
| macOS    | `~/.copilot/mcp.json` |
| Linux    | `~/.copilot/mcp.json` |

Paste the config into the `servers` section:
```json
{
  "servers": {
    "foundry": {
      "command": "node",
      "args": ["/absolute/path/to/Foundry/apps/mcp-server/dist/server.js"]
    }
  }
}
```

Note: Copilot uses `"servers"` instead of `"mcpServers"` as the top-level key.

---

#### 6. Windsurf

| Platform | Config File |
|----------|-------------|
| Windows  | `%APPDATA%\windsurf\mcp.json` or `%USERPROFILE%\.windsurf\mcp.json` |
| macOS    | `~/.windsurf/mcp.json` or `~/.config/windsurf/mcp.json` |
| Linux    | `~/.windsurf/mcp.json` or `~/.config/windsurf/mcp.json` |

Paste the config into the `mcpServers` section. Restart Windsurf.

---

#### 7. Other MCP Clients

Works with any MCP-compatible stdio client. Place the config JSON in your client's `mcpServers` section. Adjust `command`, `args`, and `env` as needed for your platform.

## Available Skills
- `frontend-design` — production-grade UI components
- `mcp-builder` — MCP server development
- `playwright-interactive` — Electron/UI debugging

## Phase Roadmap (from PRD)
1. **Phase 1** (done): Electron + SQLite + Project/Task CRUD + dashboard UI
2. **Phase 2** (done): MCP server + 28 tools + OpenCode integration
3. **Phase 3** (3wk): AI roadmap generator, sprint planner, task breakdown
4. **Phase 4** (4wk): Real-time sync, team workspace, multi-agent support

## Conventions
- Database tables: `projects`, `tasks`, `tags`, `task_tags`, `notes`, `task_history`, `settings`
- Task statuses: `todo` → `doing` → `review` → `done`
- Priorities: `low`, `medium`, `high`, `critical`
- MCP tool names: snake_case (e.g. `create_task`, `generate_tasks_from_prompt`)
- All DB queries use raw SQL via `pool.query()` (parameterized with `$N` placeholders)
- SQL `$N` placeholders are converted to `?` for SQLite compatibility
- Optimistic UI updates for drag-and-drop; revert on IPC failure
- Import ordering: builtin → external → `@/` internal → relative (enforced by ESLint)
- TSC memory: MCP SDK types are heavy; use `NODE_OPTIONS="--max-old-space-size=4096"` for `typecheck`
