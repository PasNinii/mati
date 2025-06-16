import {
  afterRenderEffect,
  Component,
  ElementRef,
  linkedSignal,
  OnDestroy,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import Konva from 'konva';

@Component({
  selector: 'hostiles-tactical-board',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
    MatCardModule,
  ],
  template: `
    <div class="tactical-board-container">
      <mat-card class="controls-card">
        <mat-card-header>
          <mat-card-title>Board Configuration</mat-card-title>
        </mat-card-header>
        <mat-card-content class="controls-content">
          @for (input of [pixelsPerMeter, height, width]; track input) {
            @switch (input) {
              @case (pixelsPerMeter) {
                <label for="pixelsPerMeter"
                  >Pixels per meter: {{ pixelsPerMeter() }}</label
                >
              }
              @case (height) {
                <label for="height">Height (meters): {{ height() }}</label>
              }
              @case (width) {
                <label for="width">Width (meters): {{ width() }}</label>
              }
            }

            <mat-slider
              min="1"
              max="40"
              step="1"
              class="full-width"
              [displayWith]="formatSliderLabel"
            >
              <input matSliderThumb [(ngModel)]="input" />
            </mat-slider>
          }
        </mat-card-content>
      </mat-card>

      <div #konvaContainer class="konva-container"></div>
    </div>
  `,
  styles: [
    `
      .tactical-board-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }

      .controls-content {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        padding: 8px;
        align-items: center;
      }

      .konva-container {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 16px;
        background-color: #ffffff;
      }
    `,
  ],
})
export class TacticalBoardComponent implements OnDestroy {
  protected readonly konvaContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('konvaContainer');

  protected readonly pixelsPerMeter = signal(20);
  protected readonly height = signal(30);
  protected readonly width = signal(20);
  protected formatSliderLabel(value: number): string {
    return `${value}`;
  }

  private readonly stage = linkedSignal<Konva.Stage>(() => {
    return new Konva.Stage({
      container: this.konvaContainer().nativeElement,
      width: this.width() * this.pixelsPerMeter(),
      height: this.height() * this.pixelsPerMeter(),
    });
  });

  private readonly layer = signal<Konva.Layer>(new Konva.Layer());
  public readonly hasBeenInitialized = signal<boolean>(false);

  constructor() {
    afterRenderEffect(() => {
      [
        this.pixelsPerMeter(),
        this.height(),
        this.width(),
        this.konvaContainer(),
      ];

      untracked(() => {
        this.initializeKonva();
        this.createBasicShapes();
      });
    });
  }

  ngOnDestroy() {
    this.stage()?.destroy();
  }

  private initializeKonva() {
    this.stage().add(this.layer());
  }

  private createBasicShapes() {
    this.createGrid();
    this.layer().draw();
  }

  private createGrid() {
    const width = this.stage().width();
    const height = this.stage().height();
    this.createHandballCourt(width, height);
  }

  private createHandballCourt(width: number, height: number) {
    const courtBackground = new Konva.Rect({
      x: 0,
      y: 0,
      width: width,
      height: height,
      fill: '#8FBC8F',
      stroke: '#228B22',
      strokeWidth: 3,
    });
    this.layer().add(courtBackground);

    // Calculate meters to pixels ratio
    const zoneCenter = width / 2;

    this.createCourtZone(zoneCenter, 0, this.pixelsPerMeter(), false);
    this.createCourtZone(zoneCenter, height, this.pixelsPerMeter(), true);
    this.createMiddle(height, width, this.pixelsPerMeter());
  }

  /**
   * Creates 6-meter and 9-meter zones at specified position
   * @param centerX X-coordinate of the zone center
   * @param yPosition Y-coordinate (0 for top, height for bottom)
   * @param pixelsPerMeter Conversion factor from meters to pixels
   * @param isBottom Whether this zone is at the bottom (true) or top (false)
   */
  private createCourtZone(
    centerX: number,
    yPosition: number,
    pixelsPerMeter: number,
    isBottom: boolean,
  ) {
    const sixMeterRadius = 6 * pixelsPerMeter;
    const nineMeterRadius = 9 * pixelsPerMeter;
    const rotation = isBottom ? 180 : 0;

    const baseZone = {
      x: centerX,
      y: yPosition,
      angle: 180,
      rotation: rotation,
    };

    // 6-meter zone
    const sixMeterZone = new Konva.Arc({
      ...baseZone,
      innerRadius: sixMeterRadius,
      outerRadius: sixMeterRadius,
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeWidth: 3,
    });
    this.layer().add(sixMeterZone);

    // 9-meter zone (dashed line)
    const nineMeterZone = new Konva.Arc({
      ...baseZone,
      innerRadius: nineMeterRadius,
      outerRadius: nineMeterRadius,
      stroke: '#000000',
      strokeWidth: 2,
      dash: [this.pixelsPerMeter() * 0.5, this.pixelsPerMeter() / 2], // Creates a dashed line
      fill: undefined,
    });
    this.layer().add(nineMeterZone);
  }

  private createMiddle(height: number, width: number, pixelsPerMeter: number) {
    const middleLine = new Konva.Line({
      points: [0, height / 2, width, height / 2],
      stroke: '#000000',
      strokeWidth: 3,
    });
    this.layer().add(middleLine);

    // Add center circle
    const centerCircleRadius = 3 * pixelsPerMeter;
    const centerCircle = new Konva.Circle({
      x: width / 2,
      y: height / 2,
      radius: centerCircleRadius,
      stroke: '#000000',
      strokeWidth: 3,
      fill: 'transparent',
    });
    this.layer().add(centerCircle);
  }
}
