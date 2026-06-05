# AGENTS.md — AI-Native Task Manager

## Project State
Development — Phase 3 (AI Roadmap Generator). Code lives in `Foundry/`.
Two reference docs define the plan:
- `AI_NATIVE_TASK_MANAGER_PRD.md` — product requirements, scope, vision
- `AI_NATIVE_TASK_MANAGER_TECHNICAL_DESIGN.md` — architecture, DB schema, flows, component tree, MCP protocol

## Core Concept
AI-native task manager where **both humans (UI) and AI agents (MCP) are first-class citizens**. Built on Supabase (PostgreSQL) accessed through the same service layer.

## Stack
| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron |
| UI | React 19 + TypeScript + Vite + TailwindCSS 4 |
| State | Zustand 5 |
| DB | Supabase (PostgreSQL) + Drizzle ORM + pg |
| MCP | @modelcontextprotocol/sdk |
| Drag-drop | dnd-kit |
| Packaging | electron-builder |
| Lint/format | ESLint 9 + Prettier 3 |
| Import alias | @/ (tsc-alias for main, Vite for renderer) |

## Key Architecture Decisions
- **Cloud-first**: Supabase PostgreSQL as source of truth; SQLite was replaced due to native module issues
- **Process model**: Electron main process hosts services; renderer talks via IPC (contextBridge); MCP server runs as stdio child process
- **Database**: Connection via `DATABASE_URL` env variable (Supabase PostgreSQL connection string)
- **Offline**: not supported; requires network connectivity for all operations
- **ID format**: nanoid with prefixes (`proj_`, `task_`, `tag_`, `note_`, `hist_`)
- **Error handling**: Zod validation + custom `AppError` hierarchy + Zustand error states + toast notifications

## Environment Setup
Copy `.env.example` to `.env` and fill in your Supabase project values:
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

## Commands (run from Foundry/)
```bash
npm run dev           # Vite + Electron dev mode
npm run build         # Production build (Vite + tsc + tsc-alias)
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix + import sorting
npm run format        # Prettier format
npm run typecheck     # TypeScript check (needs NODE_OPTIONS="--max-old-space-size=4096")
npm run mcp-server    # Start MCP server (reads DATABASE_URL from env)
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

## MCP Server (Phase 2)
The MCP server exposes 28 tools via stdio transport:
- **Project**: list_projects, get_project, create_project, update_project, delete_project, archive_project, unarchive_project
- **Task**: list_tasks, get_task, create_task, update_task, delete_task, move_task, search_tasks
- **Tag**: list_tags, create_tag, delete_tag
- **Note**: list_notes, create_note, update_note, delete_note
- **Column**: list_columns, create_column, delete_column, reorder_columns
- **AI**: analyze_project, generate_tasks_from_prompt, breakdown_task

### MCP Client Integration

The Foundry MCP server uses **stdio transport** and connects via Supabase PostgreSQL. Two methods to pass the database URL:

**Method A — CLI argument (`--db-url`)**:
```json
{
  "mcpServers": {
    "foundry": {
      "command": "node",
      "args": [
        "/absolute/path/to/Foundry/dist/mcp/server.js",
        "--db-url",
        "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
      ]
    }
  }
}
```

**Method B — Environment variable (`DATABASE_URL`)**:
```json
{
  "mcpServers": {
    "foundry": {
      "command": "node",
      "args": ["/absolute/path/to/Foundry/dist/mcp/server.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
      }
    }
  }
}
```

Build first: `npm run build` (from `Foundry/`). Replace `/absolute/path/to/Foundry` with your actual project path.

---

#### 1. OpenCode

| Platform | Config File |
|----------|-------------|
| Windows  | `%APPDATA%\opencode\opencode.jsonc` |
| macOS    | `~/.config/opencode/opencode.jsonc` |
| Linux    | `~/.config/opencode/opencode.jsonc` |

Paste either Method A or Method B config into the `mcpServers` section. Restart OpenCode.

---

#### 2. Claude Code (CLI)

| Platform | Config File |
|----------|-------------|
| Windows  | `%APPDATA%\Claude Code\settings.json` |
| macOS    | `~/.claude/settings.json` |
| Linux    | `~/.claude/settings.json` |

Paste the config (Method A or B) into the `mcpServers` section. Restart Claude Code.

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
      "args": ["/absolute/path/to/Foundry/dist/mcp/server.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
      }
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
      "args": ["/absolute/path/to/Foundry/dist/mcp/server.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
      }
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

Paste the config (Method A or B) into the `mcpServers` section. Restart Windsurf.

---

#### 7. Other MCP Clients

Works with any MCP-compatible stdio client. Place the config JSON in your client's `mcpServers` section. Adjust `command`, `args`, and `env` as needed for your platform.

## Available Skills
- `frontend-design` — production-grade UI components
- `mcp-builder` — MCP server development
- `playwright-interactive` — Electron/UI debugging
- `supabase` — Supabase platform guidance

## Phase Roadmap (from PRD)
1. **Phase 1** (done): Electron + SQLite + Project/Task CRUD + dashboard UI
2. **Phase 2** (done): MCP server + 28 tools + Supabase migration + OpenCode integration
3. **Phase 3** (3wk): AI roadmap generator, sprint planner, task breakdown
4. **Phase 4** (4wk): Real-time sync, team workspace, multi-agent support

## Conventions
- Database tables: `projects`, `tasks`, `tags`, `task_tags`, `notes`, `task_history`, `settings`
- Task statuses: `todo` → `doing` → `review` → `done`
- Priorities: `low`, `medium`, `high`, `critical`
- MCP tool names: snake_case (e.g. `create_task`, `generate_tasks_from_prompt`)
- All DB queries use async `pg` Pool with Drizzle ORM schema definitions
- Optimistic UI updates for drag-and-drop; revert on IPC failure
- Import ordering: builtin → external → `@/` internal → relative (enforced by ESLint)
- TSC memory: MCP SDK types are heavy; use `NODE_OPTIONS="--max-old-space-size=4096"` for `typecheck`
