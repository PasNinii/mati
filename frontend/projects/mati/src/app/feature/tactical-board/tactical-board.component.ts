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
import {
  CourtConfig,
  DEFAULT_COURT_CONFIG,
  DEFAULT_COURT_STYLES,
} from './models/court-config.interface';
import { HandballCourtRenderer } from './services/handball-court-renderer.service';

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
              min="20"
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
  private courtRenderer?: HandballCourtRenderer;

  constructor() {
    afterRenderEffect(() => {
      [
        this.pixelsPerMeter(),
        this.height(),
        this.width(),
        this.konvaContainer(),
      ];

      untracked(() => {
        this.initializeAndRenderCourt();
      });
    });
  }

  ngOnDestroy() {
    this.stage()?.destroy();
  }

  /**
   * Initializes Konva stage and renders the handball court
   */
  private initializeAndRenderCourt(): void {
    this.stage().add(this.layer());

    const config = this.buildCourtConfig();
    const styles = DEFAULT_COURT_STYLES;

    this.courtRenderer = new HandballCourtRenderer(
      this.layer(),
      config,
      styles,
    );

    this.courtRenderer.render();
  }

  /**
   * Builds court configuration from current signal values
   */
  private buildCourtConfig(): CourtConfig {
    return {
      widthM: this.width(),
      heightM: this.height(),
      pixelsPerMeter: this.pixelsPerMeter(),
      goalWidthM: DEFAULT_COURT_CONFIG.goalWidthM,
    };
  }
}
