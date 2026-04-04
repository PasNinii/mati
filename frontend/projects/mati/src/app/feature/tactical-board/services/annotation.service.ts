import { inject, Injectable, signal } from '@angular/core';
import Konva from 'konva';
import { KonvaStageService } from './konva-stage.service';
import { Annotation } from '../models/annotation.model';

@Injectable()
export class AnnotationService {
  private readonly konvaStage = inject(KonvaStageService);

  readonly drawingMode = signal<'none' | 'arrow'>('none');

  private annotationGroup = new Konva.Group();
  private previewArrow: Konva.Arrow | null = null;
  private drawStart: { x: number; y: number } | null = null;

  init(): void {
    this.konvaStage.overlayLayer().add(this.annotationGroup);
  }

  enableArrowMode(): void {
    this.drawingMode.set('arrow');
  }

  disableDrawing(): void {
    this.drawingMode.set('none');
    this.clearPreview();
  }

  toggleArrowMode(): void {
    if (this.drawingMode() === 'arrow') {
      this.disableDrawing();
    } else {
      this.enableArrowMode();
    }
  }

  onStageMouseDown(pos: { x: number; y: number }): void {
    if (this.drawingMode() !== 'arrow') return;
    this.drawStart = pos;

    this.previewArrow = new Konva.Arrow({
      points: [pos.x, pos.y, pos.x, pos.y],
      stroke: '#FF9800',
      fill: '#FF9800',
      strokeWidth: 3,
      pointerLength: 10,
      pointerWidth: 8,
      opacity: 0.6,
    });
    this.konvaStage.overlayLayer().add(this.previewArrow);
    this.konvaStage.overlayLayer().batchDraw();
  }

  onStageMouseMove(pos: { x: number; y: number }): void {
    if (!this.previewArrow || !this.drawStart) return;
    this.previewArrow.points([
      this.drawStart.x,
      this.drawStart.y,
      pos.x,
      pos.y,
    ]);
    this.konvaStage.overlayLayer().batchDraw();
  }

  onStageMouseUp(pos: { x: number; y: number }): Annotation | null {
    if (!this.drawStart) return null;

    const dx = pos.x - this.drawStart.x;
    const dy = pos.y - this.drawStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.clearPreview();

    // Ignore very short drags
    if (dist < 10) return null;

    return {
      id: window.crypto.randomUUID(),
      type: 'arrow',
      points: [this.drawStart.x, this.drawStart.y, pos.x, pos.y],
      color: '#FF9800',
      strokeWidth: 3,
    };
  }

  renderAnnotations(annotations: Annotation[]): void {
    this.annotationGroup.destroyChildren();

    for (const ann of annotations) {
      if (ann.type === 'arrow') {
        this.annotationGroup.add(
          new Konva.Arrow({
            points: ann.points,
            stroke: ann.color,
            fill: ann.color,
            strokeWidth: ann.strokeWidth,
            pointerLength: 10,
            pointerWidth: 8,
            opacity: 0.8,
          }),
        );
      }
    }

    this.konvaStage.overlayLayer().batchDraw();
  }

  clearAnnotations(): void {
    this.annotationGroup.destroyChildren();
    this.konvaStage.overlayLayer().batchDraw();
  }

  private clearPreview(): void {
    this.previewArrow?.destroy();
    this.previewArrow = null;
    this.drawStart = null;
    this.konvaStage.overlayLayer().batchDraw();
  }
}
