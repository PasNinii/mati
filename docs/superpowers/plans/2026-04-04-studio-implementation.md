# Studio Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a keyframe-based animation studio to the tactical handball board, with multi-select, timeline, playback, and JSON save/load.

**Architecture:** Refactor existing tactical-board internals (stable IDs, injectable EntityManager, extracted KonvaStageService, loadFormation API) then build studio as a sibling feature under `feature/tactical-board/`. Studio composes the same court renderer + entity system with its own timeline/playback/selection services.

**Tech Stack:** Angular 21 (zoneless, signals), Konva.js, Material components

**Boundary note:** ESLint boundaries prevent cross-feature imports. Studio lives under `feature/tactical-board/` so it shares the same feature scope. A separate `studio.routes.ts` file in that directory is recognized as a feature-route for `tactical-board`.

---

## File Map

### Modified files

| File | Change |
|------|--------|
| `feature/tactical-board/models/entity.model.ts` | No change (coordinates stay plain object) |
| `feature/tactical-board/models/moving-entity.model.ts` | Add `dirty` flag, `setPosition()`, `clearDirty()`, set name on group |
| `feature/tactical-board/models/player.model.ts` | Accept explicit `id` param, remove random ID generation, remove default position constants |
| `feature/tactical-board/models/ball.model.ts` | Set group name to entity ID |
| `feature/tactical-board/models/index.ts` | Export new models |
| `feature/tactical-board/services/entity-manager.service.ts` | Add `@Injectable()`, add `getById()` |
| `feature/tactical-board/services/handball-court-renderer.service.ts` | Accept EntityManager in constructor, add `loadFormation()`, refactor `initializeDefaultPlayers()` |
| `feature/tactical-board/services/index.ts` | Export new services |
| `feature/tactical-board/tactical-board.component.ts` | Add providers, use KonvaStageService |
| `feature/tactical-board/tactical-board.routes.ts` | Keep as-is |
| `app.routes.ts` | Add studio route |

### New files

| File | Purpose |
|------|---------|
| `feature/tactical-board/models/scenario.model.ts` | Scenario, Keyframe, EntityDefinition interfaces |
| `feature/tactical-board/models/formation-preset.model.ts` | Default formation data (extracted from player.model.ts) |
| `feature/tactical-board/services/konva-stage.service.ts` | Stage + layer lifecycle |
| `feature/tactical-board/services/scenario.service.ts` | JSON serialize/deserialize, file download/upload |
| `feature/tactical-board/services/selection.service.ts` | Multi-select state |
| `feature/tactical-board/services/playback.service.ts` | Animation loop + interpolation |
| `feature/tactical-board/services/studio-state.service.ts` | Timeline state facade |
| `feature/tactical-board/components/timeline/timeline.component.ts` | Timeline bar UI |
| `feature/tactical-board/components/timeline/timeline.component.scss` | Timeline styles |
| `feature/tactical-board/components/toolbar/toolbar.component.ts` | Save/Load/New/Play buttons |
| `feature/tactical-board/components/toolbar/toolbar.component.scss` | Toolbar styles |
| `feature/tactical-board/studio.component.ts` | Studio page |
| `feature/tactical-board/studio.component.scss` | Studio styles |
| `feature/tactical-board/studio.routes.ts` | Studio route |

---

## Task 1: Stable Entity IDs + Dirty Flag + setPosition

**Files:**
- Modify: `feature/tactical-board/models/moving-entity.model.ts`
- Modify: `feature/tactical-board/models/player.model.ts`
- Modify: `feature/tactical-board/models/ball.model.ts`

- [ ] **Step 1: Add dirty flag, clearDirty, and setPosition to MovingEntity**

In `moving-entity.model.ts`, add the dirty flag, mark dirty on drag, and add setPosition/clearDirty:

```typescript
import Konva from 'konva';
import { Entity } from './entity.model';

export abstract class MovingEntity extends Entity {
  draggable: boolean;
  protected showCoordinates: boolean = false;
  dirty = false;

  constructor(
    id: string,
    coordinates: { x: number; y: number },
    draggable: boolean = true,
  ) {
    super(id, coordinates);
    this.draggable = draggable;
  }

  setCoordinatesVisible(visible: boolean): void {
    this.showCoordinates = visible;
    if (this.shape instanceof Konva.Group) {
      const coordsText = this.shape.findOne('.coordinates');
      if (coordsText) {
        coordsText.visible(visible);
      }
    }
  }

  private updateCoordinatesDisplay(pixelsPerMeter: number): void {
    if (!(this.shape instanceof Konva.Group)) return;
    const coordsText = this.shape.findOne('.coordinates') as Konva.Text;
    if (coordsText) {
      const xMeters = (this.coordinates.x / pixelsPerMeter).toFixed(1);
      const yMeters = (this.coordinates.y / pixelsPerMeter).toFixed(1);
      coordsText.text(`(${xMeters}m, ${yMeters}m)`);
      coordsText.offsetX(coordsText.width() / 2);
    }
  }

  protected createCoordinatesText(
    pixelsPerMeter: number,
    offsetY: number,
  ): Konva.Text {
    const xMeters = (this.coordinates.x / pixelsPerMeter).toFixed(1);
    const yMeters = (this.coordinates.y / pixelsPerMeter).toFixed(1);
    const coordsText = new Konva.Text({
      name: 'coordinates',
      text: `(${xMeters}m, ${yMeters}m)`,
      fontSize: 10,
      fill: '#000000',
      align: 'center',
      y: offsetY,
      visible: this.showCoordinates,
    });
    coordsText.offsetX(coordsText.width() / 2);
    return coordsText;
  }

  protected setupDragHandlers(
    group: Konva.Group,
    pixelsPerMeter: number,
  ): void {
    group.on('dragmove', () => {
      this.updateCoordinates(group.x(), group.y());
      this.updateCoordinatesDisplay(pixelsPerMeter);
      this.dirty = true;
    });
  }

  /**
   * Sets entity position in absolute meters. Used by playback.
   */
  setPosition(xMeters: number, yMeters: number, pixelsPerMeter: number): void {
    const xPx = xMeters * pixelsPerMeter;
    const yPx = yMeters * pixelsPerMeter;

    if (this.shape instanceof Konva.Group) {
      this.shape.x(xPx);
      this.shape.y(yPx);
      this.updateCoordinates(xPx, yPx);
      this.updateCoordinatesDisplay(pixelsPerMeter);
    }
  }

  clearDirty(): void {
    this.dirty = false;
  }

  override updateShape(pixelsPerMeter: number, scaleFactor?: number): void {
    if (!this.shape || !(this.shape instanceof Konva.Group)) return;
    if (!scaleFactor) return;

    this.shape.x(this.shape.x() * scaleFactor);
    this.shape.y(this.shape.y() * scaleFactor);

    this.updateCoordinates(this.shape.x(), this.shape.y());
    this.updateCoordinatesDisplay(pixelsPerMeter);
  }
}
```

- [ ] **Step 2: Change Player to accept explicit ID, set group name**

In `player.model.ts`, change constructor to accept `id` parameter and set `name` on Konva group:

Remove the auto-generated ID from constructor:

```typescript
constructor(
  id: string,
  team: Team,
  role: PlayerRole,
  position: PlayerPosition,
  coordinates: EntityCoordinates,
  draggable: boolean = true,
  styles: PlayerStyles = DEFAULT_PLAYER_STYLES,
) {
  super(id, coordinates, draggable);
  this.team = team;
  this.role = role;
  this.position = position;
  this.styles = styles;
}
```

In `createShape`, set the group name:

```typescript
createShape(config: {
  pixelsPerMeter: number;
  showCoordinates: boolean;
}): Konva.Group {
  const group = new Konva.Group({
    name: this.id,
    x: this.coordinates.x,
    y: this.coordinates.y,
    draggable: this.draggable,
  });
  // ...rest unchanged
}
```

Also remove `DEFAULT_ATTACK_POSITIONS` and `DEFAULT_DEFENSE_POSITIONS` from this file (they move to formation-preset.model.ts in the next task). Keep the enums and interfaces.

- [ ] **Step 3: Set group name on Ball**

In `ball.model.ts`, add `name: this.id` to the Konva.Group config:

```typescript
createShape(config: {
  pixelsPerMeter: number;
  showCoordinates: boolean;
}): Konva.Group {
  const group = new Konva.Group({
    name: this.id,
    x: this.coordinates.x,
    y: this.coordinates.y,
    draggable: this.draggable,
  });
  // ...rest unchanged
}
```

- [ ] **Step 4: Verify build compiles**

Run: `cd frontend && npx ng build 2>&1 | tail -20`

This will fail because `DEFAULT_ATTACK_POSITIONS` and `DEFAULT_DEFENSE_POSITIONS` were removed from player.model.ts but still referenced by handball-court-renderer.service.ts. That's expected — Task 2 fixes it.

---

## Task 2: Scenario Model + Formation Presets

**Files:**
- Create: `feature/tactical-board/models/scenario.model.ts`
- Create: `feature/tactical-board/models/formation-preset.model.ts`
- Modify: `feature/tactical-board/models/index.ts`

- [ ] **Step 1: Create scenario model**

Create `frontend/projects/mati/src/app/feature/tactical-board/models/scenario.model.ts`:

```typescript
export interface EntityDefinition {
  id: string;
  type: 'player' | 'ball';
  team?: 'home' | 'away';
  role?: 'attack' | 'defense';
  position?: string;
}

export interface Keyframe {
  time: number;
  positions: Record<string, { x: number; y: number }>;
}

export interface Scenario {
  name: string;
  courtConfig: {
    widthM: number;
    heightM: number;
    fullCourt: boolean;
  };
  duration: number;
  entities: EntityDefinition[];
  keyframes: Keyframe[];
}
```

- [ ] **Step 2: Create formation preset with defaults extracted from player.model.ts**

Create `frontend/projects/mati/src/app/feature/tactical-board/models/formation-preset.model.ts`:

```typescript
import {
  AttackPosition,
  DefensePosition,
  Team,
  PlayerRole,
} from './player.model';
import { EntityDefinition } from './scenario.model';

export interface FormationPreset {
  entities: EntityDefinition[];
  positions: Record<string, { x: number; y: number }>;
}

/**
 * Default 6-0 formation: 6 home attackers + 6 away defenders + ball
 * Positions in meters from top-left origin
 */
export const DEFAULT_FORMATION: FormationPreset = {
  entities: [
    // Home attack
    { id: 'home-attack-LW', type: 'player', team: 'home', role: 'attack', position: AttackPosition.LW },
    { id: 'home-attack-RW', type: 'player', team: 'home', role: 'attack', position: AttackPosition.RW },
    { id: 'home-attack-LB', type: 'player', team: 'home', role: 'attack', position: AttackPosition.LB },
    { id: 'home-attack-CB', type: 'player', team: 'home', role: 'attack', position: AttackPosition.CB },
    { id: 'home-attack-RB', type: 'player', team: 'home', role: 'attack', position: AttackPosition.RB },
    { id: 'home-attack-P', type: 'player', team: 'home', role: 'attack', position: AttackPosition.P },
    // Away defense
    { id: 'away-defense-1-0', type: 'player', team: 'away', role: 'defense', position: DefensePosition.WINGS },
    { id: 'away-defense-1-1', type: 'player', team: 'away', role: 'defense', position: DefensePosition.WINGS },
    { id: 'away-defense-2-0', type: 'player', team: 'away', role: 'defense', position: DefensePosition.BACKS },
    { id: 'away-defense-2-1', type: 'player', team: 'away', role: 'defense', position: DefensePosition.BACKS },
    { id: 'away-defense-3-0', type: 'player', team: 'away', role: 'defense', position: DefensePosition.PIVOT_CENTER },
    { id: 'away-defense-3-1', type: 'player', team: 'away', role: 'defense', position: DefensePosition.PIVOT_CENTER },
    // Ball
    { id: 'ball', type: 'ball' },
  ],
  positions: {
    'home-attack-LW': { x: 1, y: 1 },
    'home-attack-RW': { x: 19, y: 1 },
    'home-attack-LB': { x: 1, y: 11.5 },
    'home-attack-CB': { x: 10, y: 13.5 },
    'home-attack-RB': { x: 19, y: 11.5 },
    'home-attack-P': { x: 10, y: 7 },
    'away-defense-1-0': { x: 2, y: 2.5 },
    'away-defense-1-1': { x: 18, y: 2.5 },
    'away-defense-2-0': { x: 4, y: 6 },
    'away-defense-2-1': { x: 16, y: 6 },
    'away-defense-3-0': { x: 8, y: 7.5 },
    'away-defense-3-1': { x: 12, y: 7.5 },
    'ball': { x: 10, y: 13.5 },
  },
};
```

- [ ] **Step 3: Update index.ts**

Add to `feature/tactical-board/models/index.ts`:

```typescript
export * from './scenario.model';
export * from './formation-preset.model';
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "add scenario model + formation presets"
```

---

## Task 3: Make EntityManager Injectable + Add getById

**Files:**
- Modify: `feature/tactical-board/services/entity-manager.service.ts`

- [ ] **Step 1: Add @Injectable decorator and getById method**

```typescript
import { Injectable } from '@angular/core';
import Konva from 'konva';
import { Entity } from '../models/entity.model';
import { Player } from '../models/player.model';
import { Ball } from '../models/ball.model';

@Injectable()
export class EntityManager {
  private entities: Map<string, Entity> = new Map();

  add(entity: Entity, shape: Konva.Group | Konva.Shape): void {
    entity.setShape(shape);
    this.entities.set(entity.id, entity);
  }

  remove(entity: Entity): void {
    if (this.entities.delete(entity.id)) {
      entity.destroy();
    }
  }

  getById(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  getAll(): Entity[] {
    return Array.from(this.entities.values());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getByType<T extends Entity>(type: new (...args: any[]) => T): T[] {
    const result: T[] = [];
    this.entities.forEach((entity) => {
      if (entity instanceof type) {
        result.push(entity as T);
      }
    });
    return result;
  }

  getPlayers(): Player[] {
    return this.getByType(Player);
  }

  hasBall(): boolean {
    return this.getByType(Ball).length > 0;
  }

  clear(): void {
    this.entities.forEach((entity) => entity.destroy());
    this.entities.clear();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "make EntityManager injectable, add getById"
```

---

## Task 4: Extract KonvaStageService

**Files:**
- Create: `feature/tactical-board/services/konva-stage.service.ts`

- [ ] **Step 1: Create KonvaStageService**

Create `frontend/projects/mati/src/app/feature/tactical-board/services/konva-stage.service.ts`:

```typescript
import { ElementRef, Injectable, OnDestroy, signal } from '@angular/core';
import Konva from 'konva';

@Injectable()
export class KonvaStageService implements OnDestroy {
  private _stage?: Konva.Stage;
  public readonly layer = signal<Konva.Layer>(new Konva.Layer());

  get stage(): Konva.Stage | undefined {
    return this._stage;
  }

  initStage(
    container: ElementRef<HTMLDivElement>,
    width: number,
    height: number,
  ): void {
    this._stage = new Konva.Stage({
      container: container.nativeElement,
      width,
      height,
    });
    this._stage.add(this.layer());
  }

  resize(width: number, height: number): void {
    if (!this._stage) return;
    this._stage.width(width);
    this._stage.height(height);
  }

  ngOnDestroy(): void {
    this._stage?.destroy();
  }
}
```

- [ ] **Step 2: Export from index.ts**

Add to `feature/tactical-board/services/index.ts`:

```typescript
export * from './konva-stage.service';
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "extract KonvaStageService from TacticalBoardStateService"
```

---

## Task 5: Refactor HandballCourtRenderer — Accept EntityManager + loadFormation

**Files:**
- Modify: `feature/tactical-board/services/handball-court-renderer.service.ts`

- [ ] **Step 1: Rewrite HandballCourtRenderer**

Accept EntityManager via constructor. Replace `initializeDefaultPlayers()` with generic `loadFormation()`. Remove internal EntityManager creation.

```typescript
import Konva from 'konva';
import { CourtConfig, CourtStyles } from '../models/court-config.interface';
import {
  Player,
  Team,
  PlayerRole,
  PlayerStyles,
  DEFAULT_PLAYER_STYLES,
} from '../models/player.model';
import {
  Ball,
  BallStyles,
  DEFAULT_BALL_STYLES,
} from '../models/ball.model';
import { MovingEntity } from '../models/moving-entity.model';
import { StaticEntity } from '../models/static-entity.model';
import { EntityManager } from './entity-manager.service';
import { CourtRenderer } from './court-renderer.service';
import { EntityDefinition } from '../models/scenario.model';
import { PlayerPosition } from '../models/player.model';

export { DEFAULT_PLAYER_STYLES, PlayerStyles, DEFAULT_BALL_STYLES, BallStyles };

export class HandballCourtRenderer {
  private courtRenderer: CourtRenderer;
  private showCoordinates: boolean = false;

  constructor(
    private layer: Konva.Layer,
    private entityManager: EntityManager,
    private config: CourtConfig,
    private styles: CourtStyles,
  ) {
    this.courtRenderer = new CourtRenderer(config, styles);
  }

  render(): void {
    const courtEntities = this.courtRenderer.createCourtEntities();
    courtEntities.forEach((entity) => {
      const shape = entity.createShape({
        pixelsPerMeter: this.config.pixelsPerMeter,
      });
      this.layer.add(shape);
      this.entityManager.add(entity, shape);
    });
  }

  /**
   * Loads a formation from entity definitions and positions (in meters).
   * Creates Player/Ball instances and adds them to the layer.
   */
  loadFormation(
    entities: EntityDefinition[],
    positions: Record<string, { x: number; y: number }>,
  ): void {
    const ppm = this.config.pixelsPerMeter;

    entities.forEach((def) => {
      const pos = positions[def.id];
      if (!pos) return;

      const coords = { x: pos.x * ppm, y: pos.y * ppm };

      let entity: MovingEntity;
      if (def.type === 'ball') {
        entity = new Ball(coords, true, DEFAULT_BALL_STYLES);
      } else {
        entity = new Player(
          def.id,
          (def.team as Team) ?? Team.HOME,
          (def.role as PlayerRole) ?? PlayerRole.ATTACK,
          (def.position as PlayerPosition) ?? 'CB',
          coords,
          true,
          DEFAULT_PLAYER_STYLES,
        );
      }

      const shape = entity.createShape({
        pixelsPerMeter: ppm,
        showCoordinates: this.showCoordinates,
      });
      this.layer.add(shape);
      this.entityManager.add(entity, shape);
    });
  }

  private addEntity(entity: Player | Ball): void {
    const shape = entity.createShape({
      pixelsPerMeter: this.config.pixelsPerMeter,
      showCoordinates: this.showCoordinates,
    });
    this.layer.add(shape);
    this.entityManager.add(entity, shape);
  }

  getPlayers(): Player[] {
    return this.entityManager.getPlayers();
  }

  setShowCoordinates(show: boolean): void {
    this.showCoordinates = show;
    this.entityManager.getAll().forEach((entity) => {
      if (entity instanceof MovingEntity) {
        entity.setCoordinatesVisible(show);
      }
    });
  }

  addBall(x?: number, y?: number): void {
    const balls = this.entityManager.getByType(Ball);
    balls.forEach((ball) => this.entityManager.remove(ball));

    const defaultX = (this.config.widthM * this.config.pixelsPerMeter) / 2;
    const defaultY = (this.config.heightM * this.config.pixelsPerMeter) / 2;

    const ball = new Ball(
      { x: x ?? defaultX, y: y ?? defaultY },
      true,
      DEFAULT_BALL_STYLES,
    );

    this.addEntity(ball);
  }

  removeBall(): void {
    const balls = this.entityManager.getByType(Ball);
    balls.forEach((ball) => this.entityManager.remove(ball));
  }

  hasBall(): boolean {
    return this.entityManager.hasBall();
  }

  reinitialize(newConfig: CourtConfig, newStyles?: CourtStyles): void {
    const oldPixelsPerMeter = this.config.pixelsPerMeter;
    const newPixelsPerMeter = newConfig.pixelsPerMeter;
    const scaleFactor = newPixelsPerMeter / oldPixelsPerMeter;
    const courtModeChanged = this.config.halfCourt !== newConfig.halfCourt;

    this.config = newConfig;
    this.courtRenderer.setConfig(newConfig);

    if (newStyles) {
      this.styles = newStyles;
      this.courtRenderer.setStyles(newStyles);
    }

    if (courtModeChanged) {
      this.entityManager
        .getAll()
        .filter((entity) => entity instanceof StaticEntity)
        .forEach((entity) => {
          this.entityManager.remove(entity);
        });

      const courtEntities = this.courtRenderer.createCourtEntities();
      courtEntities.forEach((entity) => {
        const shape = entity.createShape({
          pixelsPerMeter: newPixelsPerMeter,
        });
        this.layer.add(shape);
        this.entityManager.add(entity, shape);
      });

      this.entityManager.getAll().forEach((entity) => {
        if (entity instanceof MovingEntity) {
          entity.updateShape(newPixelsPerMeter, scaleFactor);
          entity.getShape()?.moveToTop();
        }
      });
    } else {
      this.entityManager.getAll().forEach((entity) => {
        if (entity instanceof StaticEntity) {
          entity.setConfig(newConfig);
          if (newStyles) {
            entity.setStyles(newStyles);
          }
        }
        entity.updateShape(newPixelsPerMeter, scaleFactor);
      });
    }
  }

  getConfig(): CourtConfig {
    return this.config;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "refactor HandballCourtRenderer: accept EntityManager, add loadFormation"
```

---

## Task 6: Update TacticalBoardStateService + Component

**Files:**
- Modify: `feature/tactical-board/services/tactical-board-state.service.ts`
- Modify: `feature/tactical-board/tactical-board.component.ts`

- [ ] **Step 1: Rewrite TacticalBoardStateService to use KonvaStageService and inject EntityManager**

```typescript
import {
  computed,
  effect,
  ElementRef,
  inject,
  Injectable,
  linkedSignal,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import {
  CourtConfig,
  DEFAULT_COURT_CONFIG,
  DEFAULT_COURT_STYLES,
} from '../models/court-config.interface';
import { HandballCourtRenderer } from './handball-court-renderer.service';
import { FilterService } from '../../../pattern/filter/filter.service';
import { KonvaStageService } from './konva-stage.service';
import { EntityManager } from './entity-manager.service';
import { DEFAULT_FORMATION } from '../models/formation-preset.model';

@Injectable()
export class TacticalBoardStateService implements OnDestroy {
  private readonly filterService = inject(FilterService);
  private readonly konvaStage = inject(KonvaStageService);
  private readonly entityManager = inject(EntityManager);

  public readonly pixelsPerMeter = linkedSignal<number>(() => {
    const filter = this.filterService.filters().get('pixelsPerMeter');
    return (filter?.value() as number) ?? 30;
  });

  public readonly height = linkedSignal<number>(() => {
    const filter = this.filterService.filters().get('courtHeight');
    return (filter?.value() as number) ?? 40;
  });

  public readonly showCoordinates = linkedSignal<boolean>(() => {
    const filter = this.filterService.filters().get('showCoordinates');
    return (filter?.value() as boolean) ?? true;
  });

  public readonly showBall = linkedSignal<boolean>(() => {
    const filter = this.filterService.filters().get('showBall');
    return (filter?.value() as boolean) ?? true;
  });

  public readonly fullCourt = linkedSignal<boolean>(() => {
    const filter = this.filterService.filters().get('fullCourt');
    return (filter?.value() as boolean) ?? false;
  });

  public readonly width = signal(20);

  public readonly effectiveHeight = computed(() =>
    this.fullCourt() ? this.height() : this.height() / 2,
  );

  private courtRenderer!: HandballCourtRenderer;

  constructor() {
    this.setupEffects();
  }

  private setupEffects(): void {
    effect(() => {
      const ppm = this.pixelsPerMeter();
      const h = this.height();
      const w = this.width();
      const full = this.fullCourt();

      untracked(() => {
        if (this.isInitialized()) {
          this.updateCourtConfiguration(ppm, w, h, full);
        }
      });
    });

    effect(() => {
      const showCoords = this.showCoordinates();
      untracked(() => {
        if (this.isInitialized()) {
          this.courtRenderer.setShowCoordinates(showCoords);
        }
      });
    });

    effect(() => {
      const shouldShowBall = this.showBall();
      untracked(() => {
        if (this.isInitialized()) {
          this.syncBallVisibility(shouldShowBall);
        }
      });
    });
  }

  private isInitialized(): boolean {
    return !!this.konvaStage.stage && !!this.courtRenderer;
  }

  ngOnDestroy(): void {
    // KonvaStageService handles its own cleanup via ngOnDestroy
  }

  public setKonvaContainer(container: ElementRef<HTMLDivElement>): void {
    this.konvaStage.initStage(
      container,
      this.width() * this.pixelsPerMeter(),
      this.effectiveHeight() * this.pixelsPerMeter(),
    );
    this.initializeCourt();
  }

  private initializeCourt(): void {
    const config = this.buildCourtConfig();
    this.courtRenderer = new HandballCourtRenderer(
      this.konvaStage.layer(),
      this.entityManager,
      config,
      DEFAULT_COURT_STYLES,
    );

    this.courtRenderer.setShowCoordinates(this.showCoordinates());
    this.courtRenderer.render();
    this.courtRenderer.loadFormation(
      DEFAULT_FORMATION.entities,
      DEFAULT_FORMATION.positions,
    );
  }

  private updateCourtConfiguration(
    pixelsPerMeter: number,
    width: number,
    height: number,
    fullCourt: boolean,
  ): void {
    const effectiveHeight = fullCourt ? height : height / 2;
    const newWidth = width * pixelsPerMeter;
    const newHeight = effectiveHeight * pixelsPerMeter;

    this.konvaStage.resize(newWidth, newHeight);

    const config = this.buildCourtConfig();
    this.courtRenderer.reinitialize(config, DEFAULT_COURT_STYLES);
    this.courtRenderer.setShowCoordinates(this.showCoordinates());
  }

  private syncBallVisibility(shouldShow: boolean): void {
    const hasBall = this.courtRenderer.hasBall();

    if (shouldShow && !hasBall) {
      this.courtRenderer.addBall();
    } else if (!shouldShow && hasBall) {
      this.courtRenderer.removeBall();
    }
  }

  private buildCourtConfig(): CourtConfig {
    return {
      widthM: this.width(),
      heightM: this.effectiveHeight(),
      pixelsPerMeter: this.pixelsPerMeter(),
      goalWidthM: DEFAULT_COURT_CONFIG.goalWidthM,
      halfCourt: !this.fullCourt(),
    };
  }
}
```

- [ ] **Step 2: Update TacticalBoardComponent providers**

Add `EntityManager` and `KonvaStageService` to the component providers:

```typescript
import { KonvaStageService } from './services';
import { EntityManager } from './services';

@Component({
  // ...existing metadata...
  providers: [TacticalBoardStateService, KonvaStageService, EntityManager],
  // ...rest unchanged
})
export class TacticalBoardComponent {
  // ...unchanged
}
```

- [ ] **Step 3: Update services/index.ts exports**

Ensure `index.ts` exports all services:

```typescript
export * from './tactical-board-state.service';
export * from './handball-court-renderer.service';
export * from './entity-manager.service';
export * from './court-renderer.service';
export * from './konva-stage.service';
```

- [ ] **Step 4: Verify build + lint**

Run: `cd frontend && npx ng build 2>&1 | tail -5`
Expected: Build succeeds.

Run: `cd frontend && npm run lint 2>&1 | tail -10`
Expected: No new lint errors.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor TacticalBoardStateService: use KonvaStageService + injectable EntityManager + loadFormation"
```

---

## Task 7: ScenarioService

**Files:**
- Create: `feature/tactical-board/services/scenario.service.ts`

- [ ] **Step 1: Create ScenarioService**

Create `frontend/projects/mati/src/app/feature/tactical-board/services/scenario.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { Scenario } from '../models/scenario.model';

@Injectable({ providedIn: 'root' })
export class ScenarioService {
  serialize(scenario: Scenario): string {
    return JSON.stringify(scenario, null, 2);
  }

  deserialize(json: string): Scenario {
    const parsed = JSON.parse(json);
    this.validate(parsed);
    return parsed as Scenario;
  }

  download(scenario: Scenario): void {
    const json = this.serialize(scenario);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name || 'scenario'}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  upload(): Promise<Scenario> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          try {
            const scenario = this.deserialize(reader.result as string);
            resolve(scenario);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      };

      input.click();
    });
  }

  private validate(obj: unknown): void {
    const s = obj as Partial<Scenario>;
    if (!s.name || typeof s.name !== 'string') {
      throw new Error('Invalid scenario: missing name');
    }
    if (!s.courtConfig) {
      throw new Error('Invalid scenario: missing courtConfig');
    }
    if (typeof s.duration !== 'number' || s.duration <= 0) {
      throw new Error('Invalid scenario: invalid duration');
    }
    if (!Array.isArray(s.entities) || s.entities.length === 0) {
      throw new Error('Invalid scenario: missing entities');
    }
    if (!Array.isArray(s.keyframes) || s.keyframes.length === 0) {
      throw new Error('Invalid scenario: missing keyframes');
    }
  }
}
```

- [ ] **Step 2: Export from index.ts**

Add to `feature/tactical-board/services/index.ts`:

```typescript
export * from './scenario.service';
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "add ScenarioService for JSON serialize/deserialize/download/upload"
```

---

## Task 8: SelectionService

**Files:**
- Create: `feature/tactical-board/services/selection.service.ts`

- [ ] **Step 1: Create SelectionService**

Create `frontend/projects/mati/src/app/feature/tactical-board/services/selection.service.ts`:

```typescript
import { computed, Injectable, signal } from '@angular/core';

@Injectable()
export class SelectionService {
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly count = computed(() => this.selectedIds().size);

  select(id: string): void {
    this.selectedIds.set(new Set([id]));
  }

  toggleSelect(id: string): void {
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }
}
```

- [ ] **Step 2: Export from index.ts**

Add to `feature/tactical-board/services/index.ts`:

```typescript
export * from './selection.service';
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "add SelectionService for multi-select state"
```

---

## Task 9: PlaybackService

**Files:**
- Create: `feature/tactical-board/services/playback.service.ts`

- [ ] **Step 1: Create PlaybackService**

Create `frontend/projects/mati/src/app/feature/tactical-board/services/playback.service.ts`:

```typescript
import { inject, Injectable, signal } from '@angular/core';
import { Keyframe } from '../models/scenario.model';
import { EntityManager } from './entity-manager.service';
import { MovingEntity } from '../models/moving-entity.model';

@Injectable()
export class PlaybackService {
  private readonly entityManager = inject(EntityManager);

  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);

  private animationId: number | null = null;
  private lastTimestamp: number | null = null;
  private keyframes: Keyframe[] = [];
  private duration = 0;
  private pixelsPerMeter = 30;

  configure(keyframes: Keyframe[], duration: number, pixelsPerMeter: number): void {
    this.keyframes = keyframes;
    this.duration = duration;
    this.pixelsPerMeter = pixelsPerMeter;
  }

  play(): void {
    if (this.isPlaying()) return;
    this.setDraggable(false);
    this.isPlaying.set(true);
    this.lastTimestamp = null;
    this.animate();
  }

  pause(): void {
    this.isPlaying.set(false);
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.setDraggable(true);
  }

  stop(): void {
    this.pause();
    this.seekTo(0);
  }

  seekTo(time: number): void {
    this.currentTime.set(Math.max(0, Math.min(time, this.duration)));
    this.applyPositionsAtTime(this.currentTime());
  }

  private animate(): void {
    this.animationId = requestAnimationFrame((timestamp) => {
      if (!this.isPlaying()) return;

      if (this.lastTimestamp === null) {
        this.lastTimestamp = timestamp;
      }

      const deltaSeconds = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;

      const newTime = this.currentTime() + deltaSeconds;

      if (newTime >= this.duration) {
        this.currentTime.set(this.duration);
        this.applyPositionsAtTime(this.duration);
        this.pause();
        return;
      }

      this.currentTime.set(newTime);
      this.applyPositionsAtTime(newTime);
      this.animate();
    });
  }

  applyPositionsAtTime(time: number): void {
    const entities = this.entityManager.getAll();

    entities.forEach((entity) => {
      if (!(entity instanceof MovingEntity)) return;

      const pos = this.interpolatePosition(entity.id, time);
      if (pos) {
        entity.setPosition(pos.x, pos.y, this.pixelsPerMeter);
      }
    });
  }

  /**
   * Linear interpolation of entity position at a given time.
   * Finds the two surrounding keyframes that contain this entity
   * and interpolates between them.
   */
  interpolatePosition(
    entityId: string,
    time: number,
  ): { x: number; y: number } | null {
    const sorted = this.keyframes;

    // Find the last keyframe at or before `time` that has this entity
    let before: { time: number; pos: { x: number; y: number } } | null = null;
    let after: { time: number; pos: { x: number; y: number } } | null = null;

    for (const kf of sorted) {
      if (kf.positions[entityId] && kf.time <= time) {
        before = { time: kf.time, pos: kf.positions[entityId] };
      }
    }

    for (const kf of sorted) {
      if (kf.positions[entityId] && kf.time > time) {
        after = { time: kf.time, pos: kf.positions[entityId] };
        break;
      }
    }

    if (!before && !after) return null;
    if (!before) return after!.pos;
    if (!after) return before.pos;

    // Linear interpolation
    const t = (time - before.time) / (after.time - before.time);
    return {
      x: before.pos.x + t * (after.pos.x - before.pos.x),
      y: before.pos.y + t * (after.pos.y - before.pos.y),
    };
  }

  private setDraggable(draggable: boolean): void {
    this.entityManager.getAll().forEach((entity) => {
      if (entity instanceof MovingEntity) {
        const shape = entity.getShape();
        if (shape) {
          shape.setAttr('draggable', draggable);
        }
      }
    });
  }
}
```

- [ ] **Step 2: Export from index.ts**

Add to `feature/tactical-board/services/index.ts`:

```typescript
export * from './playback.service';
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "add PlaybackService with interpolation and animation loop"
```

---

## Task 10: StudioStateService

**Files:**
- Create: `feature/tactical-board/services/studio-state.service.ts`

- [ ] **Step 1: Create StudioStateService**

Create `frontend/projects/mati/src/app/feature/tactical-board/services/studio-state.service.ts`:

```typescript
import {
  computed,
  ElementRef,
  inject,
  Injectable,
  OnDestroy,
  signal,
} from '@angular/core';
import Konva from 'konva';
import {
  CourtConfig,
  DEFAULT_COURT_CONFIG,
  DEFAULT_COURT_STYLES,
} from '../models/court-config.interface';
import { Keyframe, Scenario, EntityDefinition } from '../models/scenario.model';
import { DEFAULT_FORMATION } from '../models/formation-preset.model';
import { HandballCourtRenderer } from './handball-court-renderer.service';
import { KonvaStageService } from './konva-stage.service';
import { EntityManager } from './entity-manager.service';
import { SelectionService } from './selection.service';
import { PlaybackService } from './playback.service';
import { ScenarioService } from './scenario.service';
import { MovingEntity } from '../models/moving-entity.model';

@Injectable()
export class StudioStateService implements OnDestroy {
  private readonly konvaStage = inject(KonvaStageService);
  private readonly entityManager = inject(EntityManager);
  readonly selectionService = inject(SelectionService);
  readonly playbackService = inject(PlaybackService);
  private readonly scenarioService = inject(ScenarioService);

  // Scenario metadata
  readonly scenarioName = signal('Untitled');
  readonly duration = signal(12);

  // Court config
  private readonly widthM = signal(20);
  private readonly heightM = signal(20); // half court by default
  private readonly fullCourt = signal(false);
  private readonly pixelsPerMeter = signal(30);

  // Timeline state
  readonly currentTime = signal(0);
  readonly keyframes = signal<Keyframe[]>([]);
  readonly entities = signal<EntityDefinition[]>([]);

  // Derived
  readonly sortedKeyframes = computed(() =>
    [...this.keyframes()].sort((a, b) => a.time - b.time),
  );

  readonly currentKeyframeIndex = computed(() => {
    const time = this.currentTime();
    return this.sortedKeyframes().findIndex((kf) => kf.time === time);
  });

  private courtRenderer!: HandballCourtRenderer;
  private dragStartPositions = new Map<string, { x: number; y: number }>();

  ngOnDestroy(): void {
    // KonvaStageService handles its own cleanup
  }

  initStudio(container: ElementRef<HTMLDivElement>): void {
    const w = this.widthM() * this.pixelsPerMeter();
    const h = this.heightM() * this.pixelsPerMeter();

    this.konvaStage.initStage(container, w, h);
    this.initCourt();
    this.setupSelectionHandlers();
    this.loadDefaultFormation();
  }

  private initCourt(): void {
    const config = this.buildCourtConfig();
    this.courtRenderer = new HandballCourtRenderer(
      this.konvaStage.layer(),
      this.entityManager,
      config,
      DEFAULT_COURT_STYLES,
    );
    this.courtRenderer.render();
  }

  private loadDefaultFormation(): void {
    const formation = DEFAULT_FORMATION;
    this.entities.set(formation.entities);
    this.courtRenderer.loadFormation(formation.entities, formation.positions);

    // Create initial keyframe at t=0 with all positions
    this.keyframes.set([{ time: 0, positions: { ...formation.positions } }]);
    this.clearAllDirty();
  }

  // ===== Keyframe management =====

  addKeyframe(): void {
    const time = this.currentTime();
    const dirtyPositions: Record<string, { x: number; y: number }> = {};
    const ppm = this.pixelsPerMeter();

    this.entityManager.getAll().forEach((entity) => {
      if (entity instanceof MovingEntity && entity.dirty) {
        dirtyPositions[entity.id] = {
          x: parseFloat((entity.coordinates.x / ppm).toFixed(2)),
          y: parseFloat((entity.coordinates.y / ppm).toFixed(2)),
        };
      }
    });

    if (Object.keys(dirtyPositions).length === 0) {
      // No dirty entities — snapshot all moving entities (fallback for t=0)
      this.entityManager.getAll().forEach((entity) => {
        if (entity instanceof MovingEntity) {
          dirtyPositions[entity.id] = {
            x: parseFloat((entity.coordinates.x / ppm).toFixed(2)),
            y: parseFloat((entity.coordinates.y / ppm).toFixed(2)),
          };
        }
      });
    }

    const existing = this.keyframes();
    const idx = existing.findIndex((kf) => kf.time === time);

    let updated: Keyframe[];
    if (idx >= 0) {
      // Merge into existing keyframe at this time
      updated = existing.map((kf, i) =>
        i === idx
          ? { ...kf, positions: { ...kf.positions, ...dirtyPositions } }
          : kf,
      );
    } else {
      updated = [...existing, { time, positions: dirtyPositions }];
    }

    this.keyframes.set(updated.sort((a, b) => a.time - b.time));
    this.clearAllDirty();
  }

  deleteKeyframe(time: number): void {
    // Never delete the t=0 keyframe
    if (time === 0) return;
    this.keyframes.update((kfs) => kfs.filter((kf) => kf.time !== time));
  }

  seekTo(time: number): void {
    this.currentTime.set(Math.max(0, Math.min(time, this.duration())));
    this.clearAllDirty();
    this.playbackService.configure(
      this.sortedKeyframes(),
      this.duration(),
      this.pixelsPerMeter(),
    );
    this.playbackService.seekTo(this.currentTime());
  }

  nextKeyframe(): void {
    const sorted = this.sortedKeyframes();
    const time = this.currentTime();
    const next = sorted.find((kf) => kf.time > time);
    if (next) this.seekTo(next.time);
  }

  prevKeyframe(): void {
    const sorted = this.sortedKeyframes();
    const time = this.currentTime();
    const prev = [...sorted].reverse().find((kf) => kf.time < time);
    if (prev) this.seekTo(prev.time);
  }

  // ===== Playback =====

  togglePlayback(): void {
    this.playbackService.configure(
      this.sortedKeyframes(),
      this.duration(),
      this.pixelsPerMeter(),
    );

    if (this.playbackService.isPlaying()) {
      this.playbackService.pause();
    } else {
      this.playbackService.play();
    }
  }

  // ===== File I/O =====

  save(): void {
    const scenario: Scenario = {
      name: this.scenarioName(),
      courtConfig: {
        widthM: this.widthM(),
        heightM: this.heightM(),
        fullCourt: this.fullCourt(),
      },
      duration: this.duration(),
      entities: this.entities(),
      keyframes: this.sortedKeyframes(),
    };
    this.scenarioService.download(scenario);
  }

  async load(): Promise<void> {
    const scenario = await this.scenarioService.upload();

    // Clear existing entities
    this.entityManager.clear();
    this.konvaStage.layer().destroyChildren();

    // Apply court config
    this.widthM.set(scenario.courtConfig.widthM);
    this.heightM.set(scenario.courtConfig.heightM);
    this.fullCourt.set(scenario.courtConfig.fullCourt);
    this.scenarioName.set(scenario.name);
    this.duration.set(scenario.duration);

    // Resize stage
    const w = this.widthM() * this.pixelsPerMeter();
    const h = this.heightM() * this.pixelsPerMeter();
    this.konvaStage.resize(w, h);

    // Re-render court
    this.initCourt();

    // Load entities at keyframe[0] positions
    const initialPositions = scenario.keyframes[0]?.positions ?? {};
    this.entities.set(scenario.entities);
    this.courtRenderer.loadFormation(scenario.entities, initialPositions);

    // Set timeline state
    this.keyframes.set(scenario.keyframes);
    this.currentTime.set(0);
    this.clearAllDirty();
  }

  newScenario(): void {
    this.entityManager.clear();
    this.konvaStage.layer().destroyChildren();

    this.scenarioName.set('Untitled');
    this.duration.set(12);
    this.currentTime.set(0);
    this.keyframes.set([]);

    this.initCourt();
    this.loadDefaultFormation();
  }

  // ===== Selection + multi-drag =====

  private setupSelectionHandlers(): void {
    const layer = this.konvaStage.layer();
    const stage = this.konvaStage.stage;
    if (!stage) return;

    // Click on entity
    layer.on('mousedown', (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (this.playbackService.isPlaying()) return;

      const group = this.findEntityGroup(e.target);
      if (!group) return;

      const entityId = group.name();
      if (!entityId) return;

      if (e.evt.shiftKey) {
        this.selectionService.toggleSelect(entityId);
      } else {
        this.selectionService.select(entityId);
      }

      this.updateSelectionVisuals();
    });

    // Click on empty stage area
    stage.on('click', (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === stage) {
        this.selectionService.clearSelection();
        this.updateSelectionVisuals();
      }
    });

    // Multi-drag: track start positions on dragstart
    layer.on('dragstart', (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (this.playbackService.isPlaying()) return;

      const group = this.findEntityGroup(e.target);
      if (!group) return;

      // Store starting positions of all selected entities
      this.dragStartPositions.clear();
      this.selectionService.selectedIds().forEach((id) => {
        const entity = this.entityManager.getById(id);
        if (entity instanceof MovingEntity) {
          const shape = entity.getShape();
          if (shape) {
            this.dragStartPositions.set(id, {
              x: shape.getAttr('x') as number,
              y: shape.getAttr('y') as number,
            });
          }
        }
      });
    });

    // Multi-drag: move all selected entities by the same delta
    layer.on('dragmove', (e: Konva.KonvaEventObject<MouseEvent>) => {
      const group = this.findEntityGroup(e.target);
      if (!group) return;

      const draggedId = group.name();
      if (!draggedId || !this.selectionService.isSelected(draggedId)) return;

      const startPos = this.dragStartPositions.get(draggedId);
      if (!startPos) return;

      const dx = group.x() - startPos.x;
      const dy = group.y() - startPos.y;

      this.selectionService.selectedIds().forEach((id) => {
        if (id === draggedId) return;

        const entity = this.entityManager.getById(id);
        if (!(entity instanceof MovingEntity)) return;

        const entityStart = this.dragStartPositions.get(id);
        if (!entityStart) return;

        const shape = entity.getShape();
        if (shape) {
          shape.setAttr('x', entityStart.x + dx);
          shape.setAttr('y', entityStart.y + dy);
          entity.updateCoordinates(entityStart.x + dx, entityStart.y + dy);
          entity.dirty = true;
        }
      });
    });
  }

  private findEntityGroup(target: Konva.Node): Konva.Group | null {
    let current: Konva.Node | null = target;
    while (current) {
      if (current instanceof Konva.Group && current.name()) {
        // Check if this is an entity (not a layer)
        const entity = this.entityManager.getById(current.name());
        if (entity) return current;
      }
      current = current.parent;
    }
    return null;
  }

  private updateSelectionVisuals(): void {
    const selectedIds = this.selectionService.selectedIds();

    this.entityManager.getAll().forEach((entity) => {
      if (!(entity instanceof MovingEntity)) return;

      const shape = entity.getShape();
      if (!(shape instanceof Konva.Group)) return;

      const circle = shape.findOne('Circle') as Konva.Circle;
      if (!circle) return;

      if (selectedIds.has(entity.id)) {
        circle.stroke('#FFD700');
        circle.strokeWidth(3);
      } else {
        // Restore default stroke
        circle.stroke('#FFFFFF');
        circle.strokeWidth(2);
      }
    });
  }

  private clearAllDirty(): void {
    this.entityManager.getAll().forEach((entity) => {
      if (entity instanceof MovingEntity) {
        entity.clearDirty();
      }
    });
  }

  private buildCourtConfig(): CourtConfig {
    return {
      widthM: this.widthM(),
      heightM: this.heightM(),
      pixelsPerMeter: this.pixelsPerMeter(),
      goalWidthM: DEFAULT_COURT_CONFIG.goalWidthM,
      halfCourt: !this.fullCourt(),
    };
  }
}
```

- [ ] **Step 2: Export from index.ts**

Add to `feature/tactical-board/services/index.ts`:

```typescript
export * from './studio-state.service';
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "add StudioStateService: timeline, keyframes, multi-select drag, file I/O"
```

---

## Task 11: Timeline Component

**Files:**
- Create: `feature/tactical-board/components/timeline/timeline.component.ts`
- Create: `feature/tactical-board/components/timeline/timeline.component.scss`

- [ ] **Step 1: Create timeline component**

Create `frontend/projects/mati/src/app/feature/tactical-board/components/timeline/timeline.component.ts`:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Keyframe } from '../../models/scenario.model';

@Component({
  selector: 'mati-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './timeline.component.scss',
  template: `
    <div class="timeline">
      <div class="time-display">
        {{ formatTime(currentTime()) }} / {{ formatTime(duration()) }}
      </div>

      <div
        class="track"
        #track
        (mousedown)="onTrackClick($event)"
      >
        <div
          class="progress"
          [style.width.%]="progressPercent()"
        ></div>

        <div
          class="scrubber"
          [style.left.%]="progressPercent()"
        ></div>

        @for (kf of keyframes(); track kf.time) {
          <div
            class="keyframe-marker"
            [class.active]="kf.time === currentTime()"
            [style.left.%]="(kf.time / duration()) * 100"
            (mousedown)="onKeyframeClick($event, kf.time)"
            [title]="formatTime(kf.time)"
          ></div>
        }
      </div>
    </div>
  `,
})
export class TimelineComponent {
  keyframes = input.required<Keyframe[]>();
  currentTime = input.required<number>();
  duration = input.required<number>();

  timeChange = output<number>();
  keyframeSelect = output<number>();

  private readonly trackRef = viewChild<ElementRef<HTMLDivElement>>('track');

  readonly progressPercent = computed(() => {
    const d = this.duration();
    return d > 0 ? (this.currentTime() / d) * 100 : 0;
  });

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  }

  onTrackClick(event: MouseEvent): void {
    const track = this.trackRef()?.nativeElement;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const time = parseFloat((percent * this.duration()).toFixed(1));
    this.timeChange.emit(time);
  }

  onKeyframeClick(event: MouseEvent, time: number): void {
    event.stopPropagation();
    this.keyframeSelect.emit(time);
  }
}
```

- [ ] **Step 2: Create timeline styles**

Create `frontend/projects/mati/src/app/feature/tactical-board/components/timeline/timeline.component.scss`:

```scss
.timeline {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
}

.time-display {
  font-family: monospace;
  font-size: 13px;
  min-width: 90px;
  white-space: nowrap;
  color: var(--mat-sys-on-surface);
}

.track {
  flex: 1;
  height: 24px;
  background: var(--mat-sys-surface-container);
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  user-select: none;
}

.progress {
  height: 100%;
  background: var(--mat-sys-primary-container);
  border-radius: 4px 0 0 4px;
  pointer-events: none;
}

.scrubber {
  position: absolute;
  top: -2px;
  width: 4px;
  height: 28px;
  background: var(--mat-sys-primary);
  border-radius: 2px;
  transform: translateX(-50%);
  pointer-events: none;
}

.keyframe-marker {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  background: var(--mat-sys-tertiary);
  transform: translate(-50%, -50%) rotate(45deg);
  cursor: pointer;
  z-index: 1;
  transition: transform 0.15s;

  &:hover {
    transform: translate(-50%, -50%) rotate(45deg) scale(1.3);
  }

  &.active {
    background: var(--mat-sys-primary);
    transform: translate(-50%, -50%) rotate(45deg) scale(1.3);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "add Timeline component with scrubber and keyframe markers"
```

---

## Task 12: Toolbar Component

**Files:**
- Create: `feature/tactical-board/components/toolbar/toolbar.component.ts`
- Create: `feature/tactical-board/components/toolbar/toolbar.component.scss`

- [ ] **Step 1: Create toolbar component**

Create `frontend/projects/mati/src/app/feature/tactical-board/components/toolbar/toolbar.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'mati-toolbar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './toolbar.component.scss',
  template: `
    <div class="toolbar">
      <div class="transport-controls">
        <button mat-icon-button matTooltip="Previous keyframe (Left)" (click)="prevKeyframe.emit()">
          <mat-icon>skip_previous</mat-icon>
        </button>

        <button mat-icon-button matTooltip="Play/Pause (Space)" (click)="togglePlay.emit()">
          <mat-icon>{{ isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
        </button>

        <button mat-icon-button matTooltip="Next keyframe (Right)" (click)="nextKeyframe.emit()">
          <mat-icon>skip_next</mat-icon>
        </button>

        <button mat-icon-button matTooltip="Stop" (click)="stop.emit()">
          <mat-icon>stop</mat-icon>
        </button>
      </div>

      <div class="keyframe-controls">
        <button
          mat-stroked-button
          matTooltip="Add keyframe (Ctrl+K)"
          (click)="addKeyframe.emit()"
        >
          <mat-icon>add</mat-icon>
          Keyframe
        </button>

        <button
          mat-stroked-button
          color="warn"
          matTooltip="Delete keyframe (Delete)"
          [disabled]="!canDeleteKeyframe()"
          (click)="deleteKeyframe.emit()"
        >
          <mat-icon>remove</mat-icon>
          Delete
        </button>
      </div>

      <div class="file-controls">
        <button mat-stroked-button matTooltip="Save (Ctrl+S)" (click)="save.emit()">
          <mat-icon>save</mat-icon>
          Save
        </button>

        <button mat-stroked-button matTooltip="Load" (click)="load.emit()">
          <mat-icon>upload_file</mat-icon>
          Load
        </button>

        <button mat-stroked-button matTooltip="New scenario" (click)="newScenario.emit()">
          <mat-icon>note_add</mat-icon>
          New
        </button>
      </div>
    </div>
  `,
})
export class ToolbarComponent {
  isPlaying = input.required<boolean>();
  canDeleteKeyframe = input.required<boolean>();

  togglePlay = output<void>();
  stop = output<void>();
  prevKeyframe = output<void>();
  nextKeyframe = output<void>();
  addKeyframe = output<void>();
  deleteKeyframe = output<void>();
  save = output<void>();
  load = output<void>();
  newScenario = output<void>();
}
```

- [ ] **Step 2: Create toolbar styles**

Create `frontend/projects/mati/src/app/feature/tactical-board/components/toolbar/toolbar.component.scss`:

```scss
.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  flex-wrap: wrap;
}

.transport-controls,
.keyframe-controls,
.file-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.keyframe-controls,
.file-controls {
  gap: 8px;
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "add Toolbar component with transport, keyframe, and file controls"
```

---

## Task 13: Studio Component + Routing

**Files:**
- Create: `feature/tactical-board/studio.component.ts`
- Create: `feature/tactical-board/studio.component.scss`
- Create: `feature/tactical-board/studio.routes.ts`
- Modify: `app.routes.ts`

- [ ] **Step 1: Create StudioComponent**

Create `frontend/projects/mati/src/app/feature/tactical-board/studio.component.ts`:

```typescript
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { TimelineComponent } from './components/timeline/timeline.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { StudioStateService } from './services/studio-state.service';
import { KonvaStageService } from './services/konva-stage.service';
import { EntityManager } from './services/entity-manager.service';
import { SelectionService } from './services/selection.service';
import { PlaybackService } from './services/playback.service';
import { KeyboardShortcutService } from '../../core/services/keyboard-shortcut.service';

@Component({
  selector: 'mati-studio',
  imports: [
    TimelineComponent,
    ToolbarComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  providers: [
    StudioStateService,
    KonvaStageService,
    EntityManager,
    SelectionService,
    PlaybackService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './studio.component.scss',
  template: `
    <div class="studio-layout">
      <div class="studio-header">
        <mat-form-field appearance="outline" class="scenario-name">
          <mat-label>Scenario</mat-label>
          <input
            matInput
            [value]="state.scenarioName()"
            (input)="onNameChange($event)"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="duration-field">
          <mat-label>Duration (s)</mat-label>
          <input
            matInput
            type="number"
            [value]="state.duration()"
            (input)="onDurationChange($event)"
            min="1"
            max="300"
          />
        </mat-form-field>
      </div>

      <div class="canvas-area">
        <div #konvaContainer class="konva-container"></div>
      </div>

      <div class="studio-controls">
        <mati-toolbar
          [isPlaying]="state.playbackService.isPlaying()"
          [canDeleteKeyframe]="canDeleteKeyframe()"
          (togglePlay)="state.togglePlayback()"
          (stop)="state.playbackService.stop()"
          (prevKeyframe)="state.prevKeyframe()"
          (nextKeyframe)="state.nextKeyframe()"
          (addKeyframe)="state.addKeyframe()"
          (deleteKeyframe)="onDeleteKeyframe()"
          (save)="state.save()"
          (load)="onLoad()"
          (newScenario)="state.newScenario()"
        />

        <mati-timeline
          [keyframes]="state.sortedKeyframes()"
          [currentTime]="state.currentTime()"
          [duration]="state.duration()"
          (timeChange)="state.seekTo($event)"
          (keyframeSelect)="state.seekTo($event)"
        />
      </div>
    </div>
  `,
})
export class StudioComponent {
  protected readonly state = inject(StudioStateService);
  private readonly keyboardShortcutService = inject(KeyboardShortcutService);

  private readonly konvaContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('konvaContainer');

  protected readonly canDeleteKeyframe = computed(() => {
    const idx = this.state.currentKeyframeIndex();
    // Can delete if on a keyframe that is not the first one (t=0)
    return idx > 0;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.state.initStudio(this.konvaContainer());
    });

    // Register keyboard shortcuts
    const shortcuts = [
      this.keyboardShortcutService.register(' ', () =>
        this.state.togglePlayback(),
      ),
      this.keyboardShortcutService.register('arrowleft', () =>
        this.state.prevKeyframe(),
      ),
      this.keyboardShortcutService.register('arrowright', () =>
        this.state.nextKeyframe(),
      ),
      this.keyboardShortcutService.register('ctrl+s', () => this.state.save()),
      this.keyboardShortcutService.register('ctrl+k', () =>
        this.state.addKeyframe(),
      ),
      this.keyboardShortcutService.register('escape', () => {
        if (this.state.playbackService.isPlaying()) {
          this.state.playbackService.stop();
        } else {
          this.state.selectionService.clearSelection();
        }
      }),
      this.keyboardShortcutService.register('delete', () =>
        this.onDeleteKeyframe(),
      ),
    ];

    destroyRef.onDestroy(() => shortcuts.forEach((unsub) => unsub()));
  }

  protected onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.state.scenarioName.set(value);
  }

  protected onDurationChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(value) && value > 0) {
      this.state.duration.set(value);
    }
  }

  protected onDeleteKeyframe(): void {
    if (this.canDeleteKeyframe()) {
      this.state.deleteKeyframe(this.state.currentTime());
    }
  }

  protected async onLoad(): Promise<void> {
    try {
      await this.state.load();
    } catch (e) {
      console.error('Failed to load scenario:', e);
    }
  }
}
```

- [ ] **Step 2: Create studio styles**

Create `frontend/projects/mati/src/app/feature/tactical-board/studio.component.scss`:

```scss
.studio-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.studio-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;

  .scenario-name {
    flex: 1;
    max-width: 300px;
  }

  .duration-field {
    width: 120px;
  }

  // Compact form fields
  ::ng-deep .mat-mdc-form-field {
    --mat-form-field-container-height: 40px;
  }
}

.canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  background: var(--mat-sys-surface-container-lowest);
  padding: 16px;
}

.konva-container {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.studio-controls {
  border-top: 1px solid var(--mat-sys-outline-variant);
  background: var(--mat-sys-surface);
}
```

- [ ] **Step 3: Create studio routes**

Create `frontend/projects/mati/src/app/feature/tactical-board/studio.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { StudioComponent } from './studio.component';

export default <Routes>[{ path: '', component: StudioComponent }];
```

- [ ] **Step 4: Add studio route to app.routes.ts**

In `frontend/projects/mati/src/app/app.routes.ts`, add the studio route:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tactical-board' },
  {
    path: 'tactical-board',
    title: 'Tactical Board',
    loadChildren: () =>
      import('./feature/tactical-board/tactical-board.routes'),
  },
  {
    path: 'studio',
    title: 'Studio',
    loadChildren: () =>
      import('./feature/tactical-board/studio.routes'),
  },
  { path: '**', redirectTo: '' },
];
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "add Studio component, routes, and full UI wiring"
```

---

## Task 14: Verify Build + Lint + Manual Test

- [ ] **Step 1: Run lint**

Run: `cd frontend && npm run lint 2>&1 | tail -20`
Expected: No errors. If boundary violations appear, check that studio files are under `feature/tactical-board/`.

- [ ] **Step 2: Run build**

Run: `cd frontend && npx ng build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 3: Run format**

Run: `cd frontend && npm run format:write`

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "fix lint/format issues"
```

- [ ] **Step 5: Manual verification checklist**

Start dev server with `cd frontend && npm start`, then verify:
1. `/tactical-board` — existing board works as before
2. `/studio` — studio loads with court, default formation, timeline
3. Drag a player — dirty flag set
4. Click "Keyframe" — keyframe marker appears on timeline
5. Scrub to new time — player positions interpolate
6. Shift+click two players — both highlighted
7. Drag one — both move together
8. Save — JSON file downloads
9. Load — JSON file restores scenario
10. Play — animation plays through keyframes
11. Space bar toggles play/pause
12. Left/Right arrow keys navigate keyframes
