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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
    MatExpansionModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="tactical-board-container">
      <mat-card class="controls-card">
        <mat-card-header>
          <mat-card-title>Board Configuration</mat-card-title>
        </mat-card-header>
        <mat-card-content class="controls-content">
          <mat-accordion class="full-width">
            <mat-expansion-panel [expanded]="true">
              <mat-expansion-panel-header>
                <mat-panel-title>Court Settings</mat-panel-title>
              </mat-expansion-panel-header>

              <div class="settings-content">
                <mat-checkbox [(ngModel)]="fullCourt" class="full-width">
                  Draw Full Court (unchecked = half court - upper part only)
                </mat-checkbox>

                @for (input of [pixelsPerMeter, height, width]; track input) {
                  <div class="slider-group">
                    @switch (input) {
                      @case (pixelsPerMeter) {
                        <label for="pixelsPerMeter"
                          >Pixels per meter: {{ pixelsPerMeter() }}</label
                        >
                      }
                      @case (height) {
                        <label for="height"
                          >Height (meters): {{ height() }}</label
                        >
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
                  </div>
                }
              </div>
            </mat-expansion-panel>
          </mat-accordion>
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
        padding: 0;
      }

      .settings-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px 0;
      }

      .slider-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .full-width {
        width: 100%;
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
  protected readonly fullCourt = signal(false); // false = half court (upper part)
  protected formatSliderLabel(value: number): string {
    return `${value}`;
  }

  private readonly stage = linkedSignal<Konva.Stage>(() => {
    // When drawing half court, use half the height (upper part)
    const effectiveHeight = this.fullCourt()
      ? this.height()
      : this.height() / 2;

    return new Konva.Stage({
      container: this.konvaContainer().nativeElement,
      width: this.width() * this.pixelsPerMeter(),
      height: effectiveHeight * this.pixelsPerMeter(),
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
        this.fullCourt(),
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
    // When drawing half court, use half the height (upper part)
    const effectiveHeight = this.fullCourt()
      ? this.height()
      : this.height() / 2;

    return {
      widthM: this.width(),
      heightM: effectiveHeight,
      pixelsPerMeter: this.pixelsPerMeter(),
      goalWidthM: DEFAULT_COURT_CONFIG.goalWidthM,
      halfCourt: !this.fullCourt(), // Pass half court flag to renderer
    };
  }
}
