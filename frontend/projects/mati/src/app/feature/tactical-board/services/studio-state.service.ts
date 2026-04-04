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
import { OverlayService } from './overlay.service';
import { AnnotationService } from './annotation.service';
import { MovingEntity } from '../models/moving-entity.model';
import { Annotation } from '../models/annotation.model';

@Injectable()
export class StudioStateService implements OnDestroy {
  private readonly konvaStage = inject(KonvaStageService);
  private readonly entityManager = inject(EntityManager);
  readonly selectionService = inject(SelectionService);
  readonly playbackService = inject(PlaybackService);
  private readonly scenarioService = inject(ScenarioService);
  readonly overlayService = inject(OverlayService);
  readonly annotationService = inject(AnnotationService);

  // Scenario metadata
  readonly scenarioName = signal('Untitled');
  readonly duration = signal(12);

  // Court config
  private readonly widthM = signal(20);
  private readonly heightM = signal(20);
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
    this.overlayService.init();
    this.annotationService.init();
    this.initCourt();
    this.setupSelectionHandlers();
    this.setupDrawingHandlers();
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
    this.refreshOverlays();
  }

  // ===== Keyframe management =====

  addStep(): void {
    const sorted = this.sortedKeyframes();
    const currentIdx = sorted.findIndex((kf) => kf.time === this.currentTime());
    const defaultGap = 2;

    let newTime: number;
    if (currentIdx >= 0 && currentIdx < sorted.length - 1) {
      // Insert between current and next: midpoint
      const gap = sorted[currentIdx + 1].time - sorted[currentIdx].time;
      newTime = parseFloat((sorted[currentIdx].time + gap / 2).toFixed(1));
    } else {
      // Append after last keyframe (or after current)
      const lastTime = sorted.length > 0 ? sorted[sorted.length - 1].time : 0;
      newTime = parseFloat((lastTime + defaultGap).toFixed(1));
    }

    // Extend duration if needed
    if (newTime >= this.duration()) {
      this.duration.set(Math.ceil(newTime + 1));
    }

    // Snapshot all current positions at the new time
    const positions: Record<string, { x: number; y: number }> = {};
    const ppm = this.pixelsPerMeter();
    this.entityManager.getAll().forEach((entity) => {
      if (entity instanceof MovingEntity) {
        positions[entity.id] = {
          x: parseFloat((entity.coordinates.x / ppm).toFixed(2)),
          y: parseFloat((entity.coordinates.y / ppm).toFixed(2)),
        };
      }
    });

    this.keyframes.update((kfs) =>
      [...kfs, { time: newTime, positions }].sort((a, b) => a.time - b.time),
    );

    this.seekTo(newTime);
  }

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
      // No dirty entities — snapshot all moving entities
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
    this.refreshOverlays();
  }

  deleteKeyframe(time: number): void {
    if (time === 0) return;
    this.keyframes.update((kfs) => kfs.filter((kf) => kf.time !== time));
    this.refreshOverlays();
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
    this.refreshOverlays();
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
      this.overlayService.setVisible(true);
      this.refreshOverlays();
    } else {
      this.overlayService.setVisible(false);
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
    this.refreshOverlays();
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
    this.refreshOverlays();
  }

  // ===== Selection + multi-drag =====

  private setupSelectionHandlers(): void {
    const layer = this.konvaStage.layer();
    const stage = this.konvaStage.stage;
    if (!stage) return;

    // Click on entity
    layer.on('mousedown', (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (this.playbackService.isPlaying()) return;
      if (this.annotationService.drawingMode() !== 'none') return;

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
      if (this.annotationService.drawingMode() !== 'none') return;

      const group = this.findEntityGroup(e.target);
      if (!group) return;

      this.dragStartPositions.clear();
      this.selectionService.selectedIds().forEach((id) => {
        const entity = this.entityManager.getById(id);
        if (entity instanceof MovingEntity) {
          const shape = entity.getShape() as Konva.Group | undefined;
          if (shape) {
            this.dragStartPositions.set(id, {
              x: shape.x(),
              y: shape.y(),
            });
          }
        }
      });
    });

    // Refresh dirty indicators after any drag
    layer.on('dragend', () => {
      this.overlayService.updateDirtyIndicators();
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

        const shape = entity.getShape() as Konva.Group | undefined;
        if (shape) {
          shape.x(entityStart.x + dx);
          shape.y(entityStart.y + dy);
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
        circle.stroke('#FFFFFF');
        circle.strokeWidth(2);
      }
    });
  }

  updateStepGap(index: number, newGap: number): void {
    const sorted = this.sortedKeyframes();
    if (index < 0 || index >= sorted.length - 1) return;

    const currentGap = sorted[index + 1].time - sorted[index].time;
    const delta = newGap - currentGap;
    if (delta === 0) return;

    const updated = this.keyframes().map((kf) => {
      if (kf.time > sorted[index].time) {
        return { ...kf, time: parseFloat((kf.time + delta).toFixed(1)) };
      }
      return kf;
    });

    this.keyframes.set(updated.sort((a, b) => a.time - b.time));

    const maxTime = Math.max(...updated.map((kf) => kf.time));
    if (maxTime > this.duration()) {
      this.duration.set(Math.ceil(maxTime));
    }

    this.refreshOverlays();
  }

  addAnnotationToCurrentKeyframe(annotation: Annotation): void {
    const time = this.currentTime();
    const updated = this.keyframes().map((kf) => {
      if (kf.time === time) {
        return {
          ...kf,
          annotations: [...(kf.annotations ?? []), annotation],
        };
      }
      return kf;
    });
    this.keyframes.set(updated);
    this.refreshOverlays();
  }

  private setupDrawingHandlers(): void {
    const stage = this.konvaStage.stage;
    if (!stage) return;

    stage.on('mousedown', () => {
      if (this.annotationService.drawingMode() === 'none') return;
      if (this.playbackService.isPlaying()) return;
      const pos = stage.getPointerPosition();
      if (pos) this.annotationService.onStageMouseDown(pos);
    });

    stage.on('mousemove', () => {
      if (this.annotationService.drawingMode() === 'none') return;
      const pos = stage.getPointerPosition();
      if (pos) this.annotationService.onStageMouseMove(pos);
    });

    stage.on('mouseup', () => {
      if (this.annotationService.drawingMode() === 'none') return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const annotation = this.annotationService.onStageMouseUp(pos);
      if (annotation) {
        this.addAnnotationToCurrentKeyframe(annotation);
      }
    });
  }

  refreshOverlays(): void {
    if (this.playbackService.isPlaying()) {
      this.overlayService.clearAll();
      return;
    }

    const kfs = this.sortedKeyframes();
    const time = this.currentTime();
    const ppm = this.pixelsPerMeter();

    this.overlayService.updateArrows(kfs, time, ppm);
    this.overlayService.updateGhosts(kfs, time, ppm);
    this.overlayService.updateDirtyIndicators();

    // Render annotations for current keyframe
    const currentKf = kfs.find((kf) => kf.time === time);
    this.annotationService.renderAnnotations(currentKf?.annotations ?? []);
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
