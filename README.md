# Foundry — AI-Native Task Manager

An AI-native task manager where **both humans (UI) and AI agents (MCP) are first-class citizens**. Built on Supabase (PostgreSQL) accessed through a shared service layer.

## Screenshots

<div align="center">
  <img src="public/overview.png" alt="Project Overview" width="30%" />
  <img src="public/kanban.png" alt="Kanban Board" width="30%" />
  <img src="public/settings.png" alt="Settings" width="30%" />
</div>

## Features

- **Kanban board** with drag-and-drop (dnd-kit) for task management
- **Full MCP server** (28 tools) — AI agents like OpenCode, Claude Code, Cursor, Copilot interact directly with tasks
- **Project management** — create, archive, delete projects with columns and tasks
- **Task tracking** — statuses (todo → doing → review → done), priorities, assignees, dates, tags, notes
- **Desktop app** — cross-platform Electron shell (Windows, macOS, Linux)

## Monorepo Structure

```
Foundry/
├── apps/
│   ├── electron/          # Electron desktop app (React 19 + Vite + TailwindCSS 4)
│   └── mcp-server/        # MCP server (28 tools, stdio transport)
└── packages/
    ├── database/          # Drizzle ORM schema + migrations (Supabase PostgreSQL)
    ├── domain/            # Business logic + validators (Zod)
    └── shared/            # Shared types + utilities
```

## Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 33 |
| UI | React 19 + TypeScript + Vite 6 + TailwindCSS 4 |
| State | Zustand 5 |
| Database | Supabase (PostgreSQL) or PGlite (WASM, local) + Drizzle ORM + pg |
| MCP | @modelcontextprotocol/sdk |
| Drag-drop | @dnd-kit/core + @dnd-kit/sortable |
| Packaging | electron-builder |
| Monorepo | pnpm + Turborepo |
| Lint/format | ESLint 9 + Prettier 3 |

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 10+
- Either:
  - A [Supabase](https://supabase.com) project (free tier works), **or**
  - PGlite (local/offline — no external services required)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd Task_Kanban/Foundry

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# For Supabase (cloud) — edit .env with your Supabase credentials:
#   DATABASE_BACKEND=supabase
#   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
#   SUPABASE_URL=https://[REF].supabase.co
#   SUPABASE_ANON_KEY=your-anon-key-here
#
# For PGlite (local) — no credentials needed:
#   DATABASE_BACKEND=pglite
#   PGLITE_DATA_DIR=./.pglite

# 4. Push database schema
pnpm --filter @foundry/database run db:push

# 5. Start development
pnpm dev          # Electron + Vite dev mode
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_BACKEND` | `"supabase"` (default, cloud) or `"pglite"` (local/offline) |
| `DATABASE_URL` | Supabase PostgreSQL connection string (required for `supabase` backend) |
| `SUPABASE_URL` | Supabase project URL (required for `supabase` backend) |
| `SUPABASE_ANON_KEY` | Supabase anonymous API key (required for `supabase` backend) |
| `PGLITE_DATA_DIR` | Directory for PGlite persistent storage (default: in-memory, lost on restart) |

## Commands

```bash
pnpm dev           # Vite + Electron dev mode
pnpm build         # Production build (Vite + tsc + tsc-alias)
pnpm lint          # ESLint check
pnpm format        # Prettier format
pnpm typecheck     # TypeScript check (NODE_OPTIONS="--max-old-space-size=4096" recommended)
pnpm mcp-server    # Start MCP server standalone
```

### Packaging for Distribution

```bash
# From Foundry/apps/electron/:
npm run pack:win       # Windows NSIS installer
npm run pack:mac       # macOS DMG (requires macOS)
npm run pack:linux     # Linux AppImage (can build from any platform)
```

Output goes to `apps/electron/dist/installers/`.

### CI/CD (GitHub Actions)

Push to `main` or trigger manually via Actions tab — builds artifacts for all 3 platforms:
- **macOS**: `.dmg`
- **Linux**: `.AppImage`
- **Windows**: `.exe` (NSIS installer)

Download artifacts from the workflow run summary page.

### Database Management

```bash
# Generate migration from schema changes
pnpm --filter @foundry/database run db:generate

# Push schema directly to database (development)
pnpm --filter @foundry/database run db:push

# Run pending migrations
pnpm --filter @foundry/database run db:migrate
```

## MCP Server

The MCP server exposes **28 tools** via stdio transport:

| Category | Tools |
|----------|-------|
| **Project** | `list_projects`, `get_project`, `create_project`, `update_project`, `delete_project`, `archive_project`, `unarchive_project` |
| **Task** | `list_tasks`, `get_task`, `create_task`, `update_task`, `delete_task`, `move_task`, `search_tasks` |
| **Tag** | `list_tags`, `create_tag`, `delete_tag` |
| **Note** | `list_notes`, `create_note`, `update_note`, `delete_note` |
| **Column** | `list_columns`, `create_column`, `delete_column`, `reorder_columns` |
| **AI** | `analyze_project`, `generate_tasks_from_prompt`, `breakdown_task` |

### Connecting AI Clients

The Foundry MCP server supports two backends: **Supabase** (cloud) and **PGlite** (local).

> **Development vs Installed:** When running from source, the server path is `apps/mcp-server/dist/server.js`.
> When Foundry is installed (via NSIS/DMG/AppImage), the MCP server is bundled at `resources/mcp-server/server.js`
> and dependencies live at `resources/app/node_modules`. Open the app and go to
> **Settings → MCP Server** to see and copy the exact config for your environment.

Build first: `pnpm build`, then configure your MCP client:

**Method A — Supabase via `DATABASE_URL` env var (dev):**
```json
{
  "mcpServers": {
    "foundry": {
      "command": "node",
      "args": ["/absolute/path/to/Foundry/apps/mcp-server/dist/server.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
      }
    }
  }
}
```

**Method B — Supabase via `--db-url` CLI arg (dev):**
```json
{
  "mcpServers": {
    "foundry": {
      "command": "node",
      "args": [
        "/absolute/path/to/Foundry/apps/mcp-server/dist/server.js",
        "--db-url",
        "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
      ]
    }
  }
}
```

**Method C — PGlite local/offline (dev):**
```json
{
  "mcpServers": {
    "foundry": {
      "command": "node",
      "args": ["/absolute/path/to/Foundry/apps/mcp-server/dist/server.js", "--backend", "pglite"],
      "env": {
        "PGLITE_DATA_DIR": "./.pglite"
      }
    }
  }
}
```

**Method D — PGlite (installed app, Windows example):**
```json
{
  "mcpServers": {
    "foundry": {
      "command": "node",
      "args": [
        "C:\\Program Files\\Foundry\\resources\\mcp-server\\server.js",
        "--backend",
        "pglite"
      ],
      "env": {
        "PGLITE_DATA_DIR": "%APPDATA%\\Foundry\\pglite-data",
        "NODE_PATH": "C:\\Program Files\\Foundry\\resources\\app\\node_modules"
      }
    }
  }
}
```
> Paths vary by OS. Open **Settings → MCP Server** in the Foundry app to get the exact config.

### Client-Specific Config Paths

| Client | Windows | macOS / Linux | Notes |
|--------|---------|---------------|-------|
| **OpenCode** | `%APPDATA%\opencode\opencode.json` | `~/.config/opencode/opencode.json` | Or `opencode.json` in project root. Uses `mcp` key with `type: "local"` |
| **Claude Code** | `%APPDATA%\Claude Code\settings.json` | `~/.claude/settings.json` | Standard `mcpServers` format |
| **Claude Desktop** | `%APPDATA%\Claude\claude_desktop_config.json` | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) / `~/.config/Claude/claude_desktop_config.json` (Linux) | Standard `mcpServers` format |
| **Cursor** | *UI:* Settings → MCP → Add server | Same + `.cursor/mcp.json` per project | Standard `mcpServers` format |
| **GitHub Copilot** | `%USERPROFILE%\.copilot\mcp.json` | `~/.copilot/mcp.json` | Uses `"servers"` key instead of `"mcpServers"` |
| **Windsurf** | `%APPDATA%\windsurf\mcp.json` | `~/.windsurf/mcp.json` | Standard `mcpServers` format |

For detailed setup per client, see [AGENTS.md](AGENTS.md).

## Architecture

- **Cloud-first with local fallback**: Supabase PostgreSQL as source of truth; PGlite (WASM PostgreSQL) for local/offline development
- **Process model**: Electron main process hosts services; renderer talks via IPC (contextBridge); MCP server runs as stdio child process
- **ID format**: nanoid with prefixes (`proj_`, `task_`, `tag_`, `note_`, `hist_`)
- **Error handling**: Zod validation + custom `AppError` hierarchy + Zustand error states + toast notifications

## Data Model

| Table | Description |
|-------|-------------|
| `projects` | Top-level container with name, description |
| `tasks` | Cards with title, status, priority, dates, assignee |
| `tags` | Case-insensitive labels |
| `task_tags` | Many-to-many join table |
| `notes` | Markdown notes attached to tasks |
| `task_history` | Audit trail for task changes |
| `settings` | User/app configuration key-value pairs |

Task statuses: `todo` → `doing` → `review` → `done`
Priorities: `low`, `medium`, `high`, `critical`

## Roadmap

| Phase | Status | Scope |
|-------|--------|-------|
| Phase 1 | Done | Electron + Project/Task CRUD + dashboard UI |
| Phase 2 | Done | MCP server (28 tools) + Supabase migration |
| Phase 3 | In progress | AI roadmap generator, sprint planner, task breakdown |
| Phase 4 | Planned | Real-time sync, team workspace, multi-agent support |

## License

MIT
