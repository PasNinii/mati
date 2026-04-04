import { ElementRef, Injectable, OnDestroy, signal } from '@angular/core';
import Konva from 'konva';

@Injectable()
export class KonvaStageService implements OnDestroy {
  private _stage?: Konva.Stage;
  public readonly layer = signal<Konva.Layer>(new Konva.Layer());
  public readonly overlayLayer = signal<Konva.Layer>(new Konva.Layer({ listening: false }));

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
    this._stage.add(this.overlayLayer());
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
