# Studio Feature Design

## Overview

Keyframe-based animation studio for the tactical handball board. Coaches position players at specific timestamps, the studio interpolates between keyframes for smooth playback. Scenarios saved/loaded as JSON via browser download/upload.

## Data Model

### Scenario (JSON file)

```typescript
interface Scenario {
  name: string;
  courtConfig: {
    widthM: number;
    heightM: number;
    fullCourt: boolean;
  };
  duration: number; // total seconds
  entities: EntityDefinition[];
  keyframes: Keyframe[];
}

interface EntityDefinition {
  id: string;        // deterministic: "home-attack-CB", "away-defense-1-0", "ball"
  type: 'player' | 'ball';
  team?: 'home' | 'away';
  role?: 'attack' | 'defense';
  position?: string; // "CB", "LW", "1", etc.
}

interface Keyframe {
  time: number; // seconds
  positions: Record<string, { x: number; y: number }>; // entityId -> meters
}
```

### Sparse keyframes

Keyframes only store positions for entities that were **explicitly moved** since the last timeline navigation. This allows layered choreography:

1. Set initial positions at t=0 (all entities)
2. Scrub to t=12, move RB, add keyframe -> saves only `{ RB: newPos }`
3. Scrub back to t=3, move LW, add keyframe -> saves only `{ LW: newPos }`
4. RB's trajectory (t=0->t=12) is untouched

**Dirty tracking:** Each `MovingEntity` gets a `dirty` flag. Dragging sets it. "Add Keyframe" saves only dirty entities, then clears flags. Timeline navigation clears flags.

### Positions in meters

All positions stored in meters (not pixels) so scenarios are scale-independent. Conversion happens at render time via `pixelsPerMeter`.

### Interpolation

Linear interpolation between keyframes per entity. If an entity has no position in a keyframe, it holds its last known position (from the most recent prior keyframe that includes it).

## Architectural Refactors

Changes to existing code required before the studio can be built.

### 1. Stable entity IDs

**Current:** `${team}-${role}-${position}-${Date.now()}-${Math.random()}`
**New:** Deterministic IDs that survive save/load.

- Players: `{team}-{role}-{position}` e.g. `home-attack-CB`
- Defense (duplicates): `{team}-defense-{position}-{index}` e.g. `away-defense-1-0`, `away-defense-1-1`
- Ball: `ball`

### 2. EntityManager -> injectable

**Current:** Plain class, instantiated with `new` inside `HandballCourtRenderer`.
**New:** `@Injectable()` provided at `TacticalBoardComponent` level. Studio services can `inject(EntityManager)` to read/snapshot positions.

### 3. Extract KonvaStageService

**Current:** `TacticalBoardStateService` owns Konva stage, layer, container ref, resize logic, AND filter-to-config translation.
**New:** `KonvaStageService` owns stage + layer lifecycle + resize. `TacticalBoardStateService` stays as the filter->config->renderer bridge.

### 4. MovingEntity.setPosition(x, y, pixelsPerMeter)

**Current:** `updateShape()` only handles scaling (multiply by scaleFactor).
**New:** Add `setPosition(xMeters, yMeters, pixelsPerMeter)` for absolute repositioning. Used by playback to set interpolated positions.

### 5. loadFormation() replaces hardcoded initializeDefaultPlayers()

**Current:** `HandballCourtRenderer.initializeDefaultPlayers()` hardcodes both teams from constants.
**New:** `loadFormation(entities: EntityDefinition[], positions: Record<string, {x, y}>)` accepts arbitrary entity sets. Default formations become a `FormationPreset` the caller passes in. Studio uses this to load from JSON.

### 6. Entity coordinates as signals

**Current:** `coordinates: EntityCoordinates` is a plain object, updated imperatively.
**New:** `coordinates: WritableSignal<EntityCoordinates>`. Konva drag handlers `set()` on it. This makes snapshotting trivial and enables reactive dirty tracking.

## New Module: feature/studio/

```
feature/studio/
  models/
    scenario.model.ts         # Scenario, Keyframe, EntityDefinition interfaces
    formation-preset.model.ts # Default formation data (extracted from player.model.ts)
  services/
    studio-state.service.ts   # Timeline state facade
    scenario.service.ts       # JSON serialize/deserialize, file download/upload
    selection.service.ts      # Multi-select state
    playback.service.ts       # Animation loop + interpolation
  studio.component.ts         # Studio page (canvas + timeline)
  studio.routes.ts
  components/
    timeline/
      timeline.component.ts   # Timeline bar with scrubber + keyframe markers
    toolbar/
      toolbar.component.ts    # Save/Load/New/Play controls
```

### Service responsibilities

**StudioStateService** (provided at component level)
- Current scenario signal
- Current time signal
- Keyframes signal (sorted by time)
- Add/remove/update keyframes (dirty-entity-only)
- Delegates to PlaybackService for animation
- Delegates to ScenarioService for file I/O

**ScenarioService** (provided in root)
- `serialize(scenario): string` -> JSON string
- `deserialize(json: string): Scenario` -> validated scenario
- `download(scenario)` -> browser save dialog
- `upload(): Promise<Scenario>` -> file picker, parse, validate
- No canvas or Konva dependency

**SelectionService** (provided at component level)
- `selectedIds: WritableSignal<Set<string>>`
- `select(id)`, `toggleSelect(id)`, `clearSelection()`
- `isSelected(id): Signal<boolean>`
- Wires into Konva click/shift+click handlers

**PlaybackService** (provided at component level)
- `play()`, `pause()`, `stop()`, `seekTo(time)`
- `isPlaying: Signal<boolean>`
- Uses `requestAnimationFrame` loop
- Reads keyframes from StudioStateService
- Calls `MovingEntity.setPosition()` with interpolated values
- Disables dragging during playback

## Multi-Select Behavior

- **Click** player/ball -> selects it (deselects others)
- **Shift+click** -> adds/removes from selection
- **Drag** any selected node -> all selected nodes move by same delta
- **Click empty canvas** -> deselects all
- Visual: selected nodes get a highlight stroke (e.g. yellow ring)

### Implementation

Selection highlight is a Konva `Ring` or stroke change on the player's circle. `SelectionService` manages the set of selected IDs. Konva `mousedown` handler on entities checks for shift key.

Group drag: on `dragmove` of any selected entity, compute delta from last position, apply same delta to all other selected entities. Use `untracked` to avoid signal loops.

## UI Layout

```
+---------------------------------------------+
|  [Settings gear]              [Canvas]       |
|                                              |
|           Konva tactical board               |
|         (with selection highlights)          |
|                                              |
+----------------------------------------------+
|  Timeline                                    |
|  [|< ><  > >|]  [00:00]---*---------[00:12] |
|                    ^   ^       ^              |
|                    |   |       |              |
|                  keyframe markers (diamonds)  |
|                                              |
|  [+ Keyframe] [x Delete] | [Save] [Load]    |
+----------------------------------------------+
```

- Timeline is a horizontal bar below the canvas
- Scrubber (draggable thumb) shows current time
- Diamond markers at each keyframe time (clickable to jump)
- Transport controls: previous keyframe, play/pause, next keyframe
- Action buttons: add keyframe, delete keyframe, save file, load file

### Timeline component inputs/outputs

```typescript
// inputs
keyframes = input<Keyframe[]>();
currentTime = input<number>();
duration = input<number>();

// outputs
timeChange = output<number>();        // scrubber dragged
keyframeSelect = output<number>();    // marker clicked
```

## Routing

```
/                   -> redirect to /tactical-board (existing)
/tactical-board     -> TacticalBoardComponent (existing, unchanged)
/studio             -> StudioComponent (new)
```

Studio is a separate route/feature. It composes `KonvaStageService`, `EntityManager`, `HandballCourtRenderer` (same as tactical-board) plus its own studio services.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Space | Play/pause |
| Left | Previous keyframe |
| Right | Next keyframe |
| Ctrl+S | Save scenario |
| Ctrl+K | Add keyframe at current time |
| Escape | Deselect all / stop playback |
| Delete | Delete selected keyframe |

## JSON File I/O

**Save:** `ScenarioService.download()` creates a `Blob` with `application/json`, generates a download link, clicks it. File name: `{scenario.name}.json`.

**Load:** `ScenarioService.upload()` creates an `<input type="file" accept=".json">`, reads the file, parses JSON, validates structure, returns `Scenario`. On load:
1. Parse and validate JSON
2. Call `loadFormation()` with entity definitions + keyframe[0] positions
3. Set timeline state (duration, keyframes)

## What stays unchanged

- Filter system (pattern/filter/) — untouched
- Court rendering pipeline — CourtRenderer, court-shapes, handball-zone
- KeyboardShortcutService — works as-is
- ThemeService — works as-is
- Existing tactical-board route — still works independently without studio

## Unresolved questions

None — all key decisions made during brainstorming.
