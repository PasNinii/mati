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
  styleUrl: './tactical-board.component.scss',
  template: `
    <mat-drawer-container class="drawer-container" autosize>
      <mat-drawer-content>
        <div class="tactical-board-container">
          <button
            mat-mini-fab
            color="accent"
            class="theme-toggle-btn"
            (click)="toggleTheme()"
            aria-label="Toggle theme"
          >
            <mat-icon>{{
              isDarkTheme() ? 'light_mode' : 'dark_mode'
            }}</mat-icon>
          </button>

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

      <mat-drawer #drawer mode="over" position="end" class="settings-drawer">
        <mat-card class="controls-card">
          <mat-card-header>
            <mat-card-title>Board Configuration</mat-card-title>
          </mat-card-header>
          <mat-card-content class="controls-content">
            <mat-accordion class="full-width" [multi]="true">
              <mat-expansion-panel [expanded]="true">
                <mat-expansion-panel-header>
                  <mat-panel-title>Court Settings</mat-panel-title>
                </mat-expansion-panel-header>

                <div class="settings-content">
                  <mat-checkbox [(ngModel)]="fullCourt" class="full-width">
                    Draw Full Court
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
                  <mat-checkbox
                    [(ngModel)]="showCoordinates"
                    class="full-width"
                  >
                    Show Player Coordinates (x, y)
                  </mat-checkbox>

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

              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>Ball Management</mat-panel-title>
                </mat-expansion-panel-header>

                <div class="settings-content">
                  <div class="button-group">
                    <button
                      mat-raised-button
                      color="primary"
                      (click)="addBall()"
                      [disabled]="hasBall()"
                      class="full-width"
                    >
                      Add Ball (Center)
                    </button>
                    <button
                      mat-raised-button
                      color="warn"
                      (click)="removeBall()"
                      [disabled]="!hasBall()"
                      class="full-width"
                    >
                      Remove Ball
                    </button>
                  </div>

                  <div class="info-section">
                    <h4>Ball Status</h4>
                    <p class="position-info">
                      {{
                        hasBall()
                          ? 'Ball is on the court (drag to move)'
                          : 'No ball on the court'
                      }}
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
})
export class TacticalBoardComponent implements OnDestroy {
  protected readonly konvaContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('konvaContainer');

  protected readonly pixelsPerMeter = signal(30);
  protected readonly height = signal(30);
  protected readonly width = signal(20);
  protected readonly fullCourt = signal(false); // false = half court (upper part)
  protected readonly playerCount = signal(0);
  protected readonly showCoordinates = signal(true);
  protected readonly isDarkTheme = signal(false);

  protected formatSliderLabel(value: number): string {
    return `${value}`;
  }

  /**
   * Toggle between light and dark theme
   */
  protected toggleTheme(): void {
    const newTheme = !this.isDarkTheme();
    this.isDarkTheme.set(newTheme);

    // Toggle the dark-theme class on the html element
    if (newTheme) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
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
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkTheme.set(true);
      document.documentElement.classList.add('dark-theme');
    } else if (savedTheme === 'light') {
      this.isDarkTheme.set(false);
      document.documentElement.classList.remove('dark-theme');
    }

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

    // Watch for coordinate display toggle
    afterRenderEffect(() => {
      const showCoords = this.showCoordinates();
      untracked(() => {
        if (this.courtRenderer) {
          this.courtRenderer.setShowCoordinates(showCoords);
        }
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

    // Initialize players by default
    this.courtRenderer.initializeDefaultPlayers();
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
   * Adds the ball to the court at the center position
   */
  protected addBall(): void {
    if (!this.courtRenderer) return;
    this.courtRenderer.addBall();
  }

  /**
   * Removes the ball from the court
   */
  protected removeBall(): void {
    if (!this.courtRenderer) return;
    this.courtRenderer.removeBall();
  }

  /**
   * Checks if the ball is currently on the court
   */
  protected hasBall(): boolean {
    if (!this.courtRenderer) return false;
    return this.courtRenderer.hasBall();
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
