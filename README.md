# Foundry — AI-Native Task Manager

An AI-native task manager where **both humans (UI) and AI agents (MCP) are first-class citizens**. Built on Supabase (PostgreSQL) accessed through a shared service layer.

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
| Database | Supabase (PostgreSQL) + Drizzle ORM + pg |
| MCP | @modelcontextprotocol/sdk |
| Drag-drop | @dnd-kit/core + @dnd-kit/sortable |
| Packaging | electron-builder |
| Monorepo | pnpm + Turborepo |
| Lint/format | ESLint 9 + Prettier 3 |

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 10+
- A [Supabase](https://supabase.com) project (free tier works)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd Task_Kanban/Foundry

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials:
#   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
#   SUPABASE_URL=https://[REF].supabase.co
#   SUPABASE_ANON_KEY=your-anon-key-here

# 4. Push database schema
pnpm --filter @foundry/database run db:push

# 5. Start development
pnpm dev          # Electron + Vite dev mode
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous API key |

## Commands

```bash
pnpm dev           # Vite + Electron dev mode
pnpm build         # Production build (Vite + tsc + tsc-alias)
pnpm lint          # ESLint check
pnpm format        # Prettier format
pnpm typecheck     # TypeScript check (NODE_OPTIONS="--max-old-space-size=4096" recommended)
pnpm mcp-server    # Start MCP server standalone
```

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

Build first: `pnpm build`, then add this to your MCP client config:

```json
{
  "mcpServers": {
    "foundry": {
      "command": "node",
      "args": ["/absolute/path/to/Foundry/dist/mcp/server.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
      }
    }
  }
}
```

### Client-Specific Config Paths

| Client | Windows | macOS / Linux |
|--------|---------|---------------|
| **OpenCode** | `%APPDATA%\opencode\opencode.jsonc` | `~/.config/opencode/opencode.jsonc` |
| **Claude Code** | `%APPDATA%\Claude Code\settings.json` | `~/.claude/settings.json` |
| **Claude Desktop** | `%APPDATA%\Claude\claude_desktop_config.json` | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) / `~/.config/Claude/claude_desktop_config.json` (Linux) |
| **Cursor** | *UI:* Settings → MCP → Add server | Same + `.cursor/mcp.json` per project |
| **GitHub Copilot** | `%USERPROFILE%\.copilot\mcp.json` | `~/.copilot/mcp.json` |
| **Windsurf** | `%APPDATA%\windsurf\mcp.json` | `~/.windsurf/mcp.json` |

> Copilot uses `"servers"` instead of `"mcpServers"` as the top-level key.

For detailed setup per client, see [AGENTS.md](AGENTS.md).

## Architecture

- **Cloud-first**: Supabase PostgreSQL as source of truth; requires network connectivity
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
