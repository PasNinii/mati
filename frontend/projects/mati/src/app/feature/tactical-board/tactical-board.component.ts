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
import { FilterComponent } from '../../pattern/filter';
import { FilterState } from '../../pattern/filter/filter-config.interface';

@Component({
  selector: 'hostiles-tactical-board',
  standalone: true,
  imports: [MatSidenavModule, MatButtonModule, MatIconModule, FilterComponent],
  styleUrl: './tactical-board.component.scss',
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

      <mat-drawer #drawer mode="over" position="end" class="settings-drawer">
        <div class="drawer-content">
          <h2 class="drawer-title">Board Configuration</h2>

          <app-filter
            [configPath]="'assets/filters/tactical-board-filters.json'"
            [showGroupNames]="true"
            [showClearAll]="false"
            [showShare]="true"
            (filtersChanged)="onFiltersChanged($event)"
          />
        </div>
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
  protected readonly showBall = signal(true);

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

    // Watch for coordinate display toggle
    afterRenderEffect(() => {
      const showCoords = this.showCoordinates();
      untracked(() => {
        if (this.courtRenderer) {
          this.courtRenderer.setShowCoordinates(showCoords);
        }
      });
    });

    // Watch for ball visibility toggle
    afterRenderEffect(() => {
      const shouldShowBall = this.showBall();
      untracked(() => {
        if (this.courtRenderer) {
          if (shouldShowBall && !this.hasBall()) {
            this.addBall();
          } else if (!shouldShowBall && this.hasBall()) {
            this.removeBall();
          }
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.stage()?.destroy();
  }

  /**
   * Handle filter changes from the filter component
   */
  protected onFiltersChanged(state: FilterState): void {
    // Update court dimensions - check for undefined/null, not falsy values
    if (state['courtWidth'] !== undefined && state['courtWidth'] !== null) {
      this.width.set(Number(state['courtWidth']));
    }
    if (state['courtHeight'] !== undefined && state['courtHeight'] !== null) {
      this.height.set(Number(state['courtHeight']));
    }

    // Update zoom level
    if (
      state['pixelsPerMeter'] !== undefined &&
      state['pixelsPerMeter'] !== null
    ) {
      this.pixelsPerMeter.set(Number(state['pixelsPerMeter']));
    }

    // Update display options
    if (state['showCoordinates'] !== undefined) {
      this.showCoordinates.set(Boolean(state['showCoordinates']));
    }

    if (state['showBall'] !== undefined) {
      this.showBall.set(Boolean(state['showBall']));
    }
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

    // Set initial showCoordinates state
    this.courtRenderer.setShowCoordinates(this.showCoordinates());

    // Initialize players by default
    this.courtRenderer.initializeDefaultPlayers();
    this.courtRenderer.render();
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
