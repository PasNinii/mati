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
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import Konva from 'konva';
import {
  CourtConfig,
  DEFAULT_COURT_CONFIG,
  DEFAULT_COURT_STYLES,
} from './models/court-config.interface';
import {
  HandballCourtRenderer,
  DEFAULT_PLAYER_STYLES,
} from './services/handball-court-renderer.service';
import {
  Player,
  Team,
  PlayerRole,
  AttackPosition,
  DefensePosition,
} from './models/player.model';

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
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <mat-drawer-container class="drawer-container" autosize>
      <mat-drawer-content>
        <div class="tactical-board-container">
          <button
            mat-fab
            color="primary"
            class="toggle-drawer-btn"
            (click)="drawer.toggle()"
            aria-label="Toggle settings"
          >
            <mat-icon>{{ drawer.opened ? 'close' : 'settings' }}</mat-icon>
          </button>

          <div #konvaContainer class="konva-container"></div>
        </div>
      </mat-drawer-content>

      <mat-drawer #drawer mode="side" position="end" class="settings-drawer">
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

                  @for (input of [pixelsPerMeter, height]; track input) {
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

              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>Player Management</mat-panel-title>
                </mat-expansion-panel-header>

                <div class="settings-content">
                  <div class="button-group">
                    <button
                      mat-raised-button
                      color="primary"
                      (click)="initializePlayers()"
                      class="full-width"
                    >
                      Initialize Players (6 per team)
                    </button>
                    <button
                      mat-raised-button
                      color="warn"
                      (click)="clearAllPlayers()"
                      class="full-width"
                    >
                      Clear All Players
                    </button>
                  </div>

                  <div class="info-section">
                    <h4>Attack Positions</h4>
                    <p class="position-info">
                      RW = Right Wing<br />
                      RB = Right Back<br />
                      CB = Center Back<br />
                      LB = Left Back<br />
                      LW = Left Wing<br />
                      P = Pivot
                    </p>

                    <h4>Defense Positions</h4>
                    <p class="position-info">
                      1 = Wings<br />
                      2 = Right & Left Back<br />
                      3 = Pivot & Center Back
                    </p>

                    <h4>Player Count</h4>
                    <p class="position-info">
                      Total: {{ playerCount() }} players
                    </p>
                  </div>
                </div>
              </mat-expansion-panel>
            </mat-accordion>
          </mat-card-content>
        </mat-card>
      </mat-drawer>
    </mat-drawer-container>
  `,
  styles: [
    `
      .drawer-container {
        width: 100%;
        height: 100vh;
      }

      .tactical-board-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
        height: 100%;
        position: relative;
      }

      .toggle-drawer-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        z-index: 1000;
      }

      .settings-drawer {
        width: 350px;
        padding: 16px;
      }

      .controls-card {
        height: 100%;
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
        flex: 1;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 16px;
        background-color: #ffffff;
      }

      .button-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .info-section {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e0e0e0;
      }

      .info-section h4 {
        margin: 12px 0 8px 0;
        font-size: 14px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }

      .position-info {
        margin: 0;
        font-size: 12px;
        line-height: 1.6;
        color: rgba(0, 0, 0, 0.6);
      }
    `,
  ],
})
export class TacticalBoardComponent implements OnDestroy {
  protected readonly konvaContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('konvaContainer');

  protected readonly pixelsPerMeter = signal(30);
  protected readonly height = signal(30);
  protected readonly width = signal(20);
  protected readonly fullCourt = signal(false); // false = half court (upper part)
  protected readonly playerCount = signal(0);

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
    const playerStyles = DEFAULT_PLAYER_STYLES;

    this.courtRenderer = new HandballCourtRenderer(
      this.layer(),
      config,
      styles,
      playerStyles,
    );

    this.courtRenderer.render();
    this.updatePlayerCount();
  }

  /**
   * Initialize default players on the court
   */
  protected initializePlayers(): void {
    if (!this.courtRenderer) return;

    this.courtRenderer.initializeDefaultPlayers();
    this.courtRenderer.refresh();
    this.updatePlayerCount();
  }

  /**
   * Clear all players from the court
   */
  protected clearAllPlayers(): void {
    if (!this.courtRenderer) return;

    this.courtRenderer.clearPlayers();
    this.updatePlayerCount();
  }

  /**
   * Updates the player count signal
   */
  private updatePlayerCount(): void {
    if (this.courtRenderer) {
      this.playerCount.set(this.courtRenderer.getPlayers().length);
    } else {
      this.playerCount.set(0);
    }
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
