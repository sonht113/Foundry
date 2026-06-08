# Changelog

## [Unreleased]

### Changed

- **Remove Supabase entirely** — SQLite is now the only database backend
- Remove `--backend` and `--db-url` CLI args from MCP server (always uses SQLite)
- Remove `--backend sqlite` from client configs (MCP server defaults to SQLite)
- Remove Drizzle ORM, pg, drizzle-kit, supabase-js, dotenv from dependencies
- Remove `db:generate`, `db:push`, `db:migrate` scripts (no longer needed)
- Remove Supabase schema (`pgTable`) and Drizzle migrations folder
- Simplify `pglite-adapter.ts` → merged into `sqlite-adapter.ts`
- Simplify `connection.ts` — SQLite-only, remove `getPool()`, `getDb()`, `getBackend()`
- Simplify `migrate.ts` — no-op (tables created by adapter on connection)
- Simplify Electron Settings UI — remove backend switching (Supabase option)
- Simplify MCP Setup Guide — remove Supabase toggle and backend selection
- Simplify ConnectionDialog — remove Supabase step
- Remove `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DATABASE_BACKEND` env vars
- Remove `config:testConnection`, `db:switchBackend`, `db:restartApp`, `db:reconnect` IPC handlers
- Remove `.env` file with embedded Supabase credentials

### Fixed

- `convertParams` correctly handles repeated `$N` references (fixes `NOT NULL constraint failed` on `settings.value`)
- Replace PostgreSQL-only `ILIKE` with SQLite-compatible `LIKE` in task search
- SQLite data now persists to disk automatically after every write (was in-memory only)
- Add default data directory fallback per OS (matches Electron's `userData` path)
- MCP server and Electron app now share the same SQLite database file

## [0.1.2] - 2026-06-08

### Changed

- Replace PGlite with sql.js (SQLite) for local database backend — resolves WASM compatibility issues with Electron
- Upgrade Electron 33 → 34.5.8 for improved stability

### Fixed

- Auto-fallback to SQLite when no DATABASE_URL configured (prevents "Cannot read properties of null" on fresh install)
- Graceful error handling: clear error messages when DB not connected, instead of raw TypeError
- Reconnection mechanism: backend switching in Settings now hot-reconnects without restart

## [0.1.1] - 2026-06-08

### Fixed

- Graceful error handling: clear "Database not connected" message instead of "Cannot read properties of null"

## [0.1.0] - 2026-06-05

### Added

- Initial project setup
- Phase 1: Electron desktop shell + Project/Task CRUD + Kanban dashboard UI
- Phase 2: MCP server with 28 tools via stdio transport
- Phase 2: Supabase PostgreSQL + Drizzle ORM migration
- Phase 2: PGlite local database backend (replaced by SQLite in v0.1.2)
- Phase 2: OpenCode, Claude Desktop, Cursor, Copilot MCP client integration
- Phase 3: AI roadmap generator (3 tools: analyze_project, generate_tasks_from_prompt, breakdown_task)
- Phase 3: Task activity/history with status change tracking
- Phase 3: Task conversations for external MCP comment sync (Jira, Backlog, etc.)
- Phase 3: Confirm modal with danger/primary variants and dark mode
- Phase 3: Windows NSIS installer packaging
