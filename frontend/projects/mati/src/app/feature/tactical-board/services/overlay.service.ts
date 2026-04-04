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
