# Changelog

## [Unreleased]

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
