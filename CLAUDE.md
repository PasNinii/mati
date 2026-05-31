# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Tactical handball board web app for coaches. Frontend-only Angular application (Angular 21, Konva.js). All commands run from `frontend/`.

Two routes, both under `feature/tactical-board/`:

- `/tactical-board` — static board; configured live via the filter drawer (court size, zoom, ball/coordinate toggles).
- `/studio` — keyframe **animation** editor; place entities per keyframe, scrub/play movement, draw arrow annotations, save/load scenarios as JSON.

`/` redirects to `/tactical-board`.

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

- `core/` — singleton services: theme, keyboard shortcuts; `core.ts` exports `provideCore()`.
- `pattern/filter/` — reusable filter system; loads config from `assets/filters/*.json`, syncs to URL query params.
- `feature/tactical-board/` — holds **both** the `tactical-board` and `studio` routes (separate components/state, shared Konva services).
- `ui/`, `layout/` — currently empty placeholders (boundary layers reserved).

`feature/tactical-board/services/` (provided per-component, not root singletons):

Shared low-level:
- `konva-stage.service.ts` — owns the Konva `Stage`/`Layer`, sizing, cleanup.
- `entity-manager.service.ts` — player/ball lifecycle, lookup by id.
- `handball-court-renderer.service.ts` / `court-renderer.service.ts` — draw court + formations on the layer.

Static board (`tactical-board`):
- `tactical-board-state.service.ts` — facade; `linkedSignal()` binds `FilterService` values, effects re-render.

Studio (`studio`):
- `studio-state.service.ts` — orchestrator: keyframes, current time, multi-select drag, save/load, wiring of the services below.
- `playback.service.ts` — rAF animation loop interpolating positions between keyframes.
- `overlay.service.ts` — non-interactive layer: movement arrows, ghost positions, dirty indicators.
- `annotation.service.ts` — arrow-drawing mode and rendering of per-keyframe annotations.
- `scenario.service.ts` — JSON download/upload of a `Scenario`.
- `selection.service.ts` — selected-entity id set.

**Data flows:**

- Static board: `FilterService` loads JSON config → `TacticalBoardStateService` `linkedSignal()`s bind filter values → effects call `HandballCourtRenderer` → Konva stage updates.
- Studio: user edits/keyframes write plain `signal()`s in `StudioStateService` → `seekTo`/`togglePlayback` drive `PlaybackService` (interpolation) and `refreshOverlays()` → `OverlayService` + `AnnotationService` redraw. Studio does **not** use `FilterService`.

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
    "type": "slider",          // see types below; chooses BaseFilter subclass
    "defaultValue": 30,
    "min": 10, "max": 100, "step": 5,  // slider/number-specific
    "clearable": false,
    "shortcut": "ctrl+b",              // boolean-specific
    "shortcuts": { "increment": "ctrl+i", "decrement": "ctrl+o" }  // slider-specific
  }]
}]
```

`type` → subclass mapping lives in `pattern/filter/models/filter.factory.ts`:

| type           | model class           |
|----------------|-----------------------|
| `boolean`      | `BooleanFilter`       |
| `slider`       | `NumericFilter`       |
| `number`       | `NumberFilter`        |
| `select`       | `SelectFilter`        |
| `multi-select` | `ArrayFilter`         |
| `text` (default)| `TextFilter`         |

(The `FilterType` enum also lists `range`/`date`/`date-range`, but those are not yet wired in the factory.)

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
