# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Tactical handball board web app for coaches. Frontend-only Angular application. All commands run from `frontend/`.

## Commands

```bash
pnpm start          # dev server at http://localhost:8103
pnpm test           # Karma + Jasmine tests
pnpm lint           # ESLint
pnpm ci             # lint → test → build (full pipeline)
pnpm format:write   # Prettier auto-format
```

Package manager is **pnpm** (build scripts allowlisted in `frontend/pnpm-workspace.yaml`).

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

## Import Boundaries (enforced by eslint-plugin-boundaries)

Layers can only import from layers above them:

```
core        ← base layer (theme, keyboard shortcuts)
ui          ← can import core
pattern     ← can import core, ui
feature     ← can import core, ui, pattern (NOT other features)
feature-routes ← can import core, pattern, own feature (NOT other feature-routes)
layout      ← can import core, ui, pattern
app         ← can import core, layout, feature-routes
```

Features are isolated — `feature/tactical-board/` cannot import from another feature.

## Filter Config Format

Filter configs live in `assets/filters/*.json`. Structure:

```json
[{
  "id": "group-id",
  "name": "Group Name",
  "filters": [{
    "id": "filterId",          // maps to FilterService key + URL query param
    "label": "Display Label",
    "type": "slider|boolean",  // determines BaseFilter subclass
    "defaultValue": 30,
    "min": 10, "max": 100, "step": 5,  // slider-specific
    "clearable": false,
    "shortcut": "ctrl+b",              // boolean-specific
    "shortcuts": { "increment": "ctrl+i", "decrement": "ctrl+o" }  // slider-specific
  }]
}]
```

`FilterService` loads these at init, creates typed filter instances, and syncs values to URL query params using the `id` as the param name.

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
