import { inject, Injectable, signal } from '@angular/core';
import Konva from 'konva';
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

  interpolatePosition(
    entityId: string,
    time: number,
  ): { x: number; y: number } | null {
    const sorted = this.keyframes;

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

    const t = (time - before.time) / (after.time - before.time);
    return {
      x: before.pos.x + t * (after.pos.x - before.pos.x),
      y: before.pos.y + t * (after.pos.y - before.pos.y),
    };
  }

  private setDraggable(draggable: boolean): void {
    this.entityManager.getAll().forEach((entity) => {
      if (entity instanceof MovingEntity) {
        const shape = entity.getShape() as Konva.Group | undefined;
        if (shape) {
          shape.draggable(draggable);
        }
      }
    });
  }
}
