# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Tactical handball board web app for coaches. Frontend-only Angular application. All commands run from `frontend/`.

## Commands

```bash
npm start          # dev server at http://localhost:8103
npm test           # Karma + Jasmine tests
npm run lint       # ESLint
npm run ci         # lint → test → build (full pipeline)
npm run format:write  # Prettier auto-format
```

## Architecture

Feature-based modular Angular app (zoneless, signals-first, no NgModules).

**Key modules** under `frontend/projects/mati/src/app/`:

- `core/` — singleton services: theme, keyboard shortcuts
- `feature/tactical-board/` — main feature; Konva.js canvas board
  - `services/tactical-board-state.service.ts` — facade; links filter signals → renderer
  - `services/handball-court-renderer.service.ts` — orchestrates Konva rendering
  - `services/entity-manager.service.ts` — player/ball lifecycle on canvas
- `pattern/filter/` — reusable filter system; loads config from `assets/filters/*.json`, syncs to URL query params

**Data flow:** `FilterService` loads JSON config → `TacticalBoardStateService` uses `linkedSignal()` to bind filter values → effects trigger `HandballCourtRenderer` → Konva stage updates in component's `konvaContainer` ref.

## Angular Conventions

- Standalone components (do **not** set `standalone: true` — it's the default)
- `changeDetection: ChangeDetectionStrategy.OnPush` on every component
- `input()` / `output()` functions, not decorators
- `inject()` for DI, not constructor injection
- Native control flow: `@if`, `@for`, `@switch` — not `*ngIf` / `*ngFor`
- `class` bindings, not `ngClass`; `style` bindings, not `ngStyle`
- Host bindings in `host: {}` object, not `@HostBinding` / `@HostListener`
- Signals for state; `computed()` for derived state; `update()`/`set()` not `mutate()`
- Reactive forms over template-driven
