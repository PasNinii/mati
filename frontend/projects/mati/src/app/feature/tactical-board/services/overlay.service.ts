import { inject, Injectable } from '@angular/core';
import Konva from 'konva';
import { KonvaStageService } from './konva-stage.service';
import { EntityManager } from './entity-manager.service';
import { MovingEntity } from '../models/moving-entity.model';
import { Player } from '../models/player.model';
import { Ball } from '../models/ball.model';
import { Keyframe } from '../models/scenario.model';
import { resolvePositionAtTime } from '../utils/keyframe.utils';

@Injectable()
export class OverlayService {
  private readonly konvaStage = inject(KonvaStageService);
  private readonly entityManager = inject(EntityManager);

  private arrowGroup = new Konva.Group();
  private ghostGroup = new Konva.Group();
  private dirtyGroup = new Konva.Group();

  init(): void {
    const overlay = this.konvaStage.overlayLayer();
    overlay.add(this.arrowGroup);
    overlay.add(this.ghostGroup);
    overlay.add(this.dirtyGroup);
  }

  updateArrows(
    sortedKeyframes: Keyframe[],
    currentTime: number,
    pixelsPerMeter: number,
  ): void {
    this.arrowGroup.destroyChildren();

    let currentKfIndex = -1;
    for (let i = sortedKeyframes.length - 1; i >= 0; i--) {
      if (sortedKeyframes[i].time <= currentTime) {
        currentKfIndex = i;
        break;
      }
    }

    const nextKf = sortedKeyframes[currentKfIndex + 1];
    if (!nextKf) return;

    this.entityManager.getAll().forEach((entity) => {
      if (!(entity instanceof MovingEntity)) return;

      const currentPos = resolvePositionAtTime(entity.id, sortedKeyframes, currentTime);
      const nextPos = nextKf.positions[entity.id];
      if (!currentPos || !nextPos) return;

      const dx = nextPos.x - currentPos.x;
      const dy = nextPos.y - currentPos.y;
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;

      let color = '#999999';
      if (entity instanceof Player) {
        color = entity.getColor();
      } else if (entity instanceof Ball) {
        color = '#333333';
      }

      const arrow = new Konva.Arrow({
        points: [
          currentPos.x * pixelsPerMeter,
          currentPos.y * pixelsPerMeter,
          nextPos.x * pixelsPerMeter,
          nextPos.y * pixelsPerMeter,
        ],
        stroke: color,
        fill: color,
        strokeWidth: 2,
        pointerLength: 8,
        pointerWidth: 6,
        dash: [8, 4],
        opacity: 0.4,
      });

      this.arrowGroup.add(arrow);
    });

    this.konvaStage.overlayLayer().batchDraw();
  }

  updateGhosts(
    sortedKeyframes: Keyframe[],
    currentTime: number,
    pixelsPerMeter: number,
  ): void {
    this.ghostGroup.destroyChildren();

    // Find prev and next keyframe relative to current time
    let prevKf: Keyframe | null = null;
    let nextKf: Keyframe | null = null;

    for (let i = sortedKeyframes.length - 1; i >= 0; i--) {
      if (sortedKeyframes[i].time < currentTime) {
        prevKf = sortedKeyframes[i];
        break;
      }
    }
    for (const kf of sortedKeyframes) {
      if (kf.time > currentTime) {
        nextKf = kf;
        break;
      }
    }

    this.entityManager.getAll().forEach((entity) => {
      if (!(entity instanceof MovingEntity)) return;

      const currentPos = resolvePositionAtTime(entity.id, sortedKeyframes, currentTime);
      if (!currentPos) return;

      let color = '#999999';
      let radius = 12;
      if (entity instanceof Player) {
        color = entity.getColor();
        radius = entity.radius;
      } else if (entity instanceof Ball) {
        color = '#333333';
        radius = entity.radius;
      }

      // Previous ghost
      if (prevKf) {
        const prevPos = prevKf.positions[entity.id];
        if (prevPos && (Math.abs(prevPos.x - currentPos.x) > 0.01 || Math.abs(prevPos.y - currentPos.y) > 0.01)) {
          this.ghostGroup.add(new Konva.Circle({
            x: prevPos.x * pixelsPerMeter,
            y: prevPos.y * pixelsPerMeter,
            radius,
            fill: color,
            opacity: 0.25,
          }));
        }
      }

      // Next ghost
      if (nextKf) {
        const nextPos = nextKf.positions[entity.id];
        if (nextPos && (Math.abs(nextPos.x - currentPos.x) > 0.01 || Math.abs(nextPos.y - currentPos.y) > 0.01)) {
          this.ghostGroup.add(new Konva.Circle({
            x: nextPos.x * pixelsPerMeter,
            y: nextPos.y * pixelsPerMeter,
            radius,
            fill: color,
            opacity: 0.15,
          }));
        }
      }
    });

    this.konvaStage.overlayLayer().batchDraw();
  }

  updateDirtyIndicators(): void {
    this.dirtyGroup.destroyChildren();

    this.entityManager.getAll().forEach((entity) => {
      if (!(entity instanceof MovingEntity) || !entity.dirty) return;

      let radius = 12;
      if (entity instanceof Player) {
        radius = entity.radius;
      } else if (entity instanceof Ball) {
        radius = entity.radius;
      }

      const shape = entity.getShape() as Konva.Group | undefined;
      if (!shape) return;

      this.dirtyGroup.add(new Konva.Ring({
        x: shape.x(),
        y: shape.y(),
        innerRadius: radius + 2,
        outerRadius: radius + 5,
        fill: '#76FF03',
        opacity: 0.7,
      }));
    });

    this.konvaStage.overlayLayer().batchDraw();
  }

  clearAll(): void {
    this.arrowGroup.destroyChildren();
    this.ghostGroup.destroyChildren();
    this.dirtyGroup.destroyChildren();
    this.konvaStage.overlayLayer().batchDraw();
  }

  setVisible(visible: boolean): void {
    this.konvaStage.overlayLayer().visible(visible);
    this.konvaStage.overlayLayer().batchDraw();
  }
}
