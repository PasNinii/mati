import {
  computed,
  effect,
  ElementRef,
  inject,
  Injectable,
  linkedSignal,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import Konva from 'konva';
import {
  CourtConfig,
  DEFAULT_COURT_CONFIG,
  DEFAULT_COURT_STYLES,
} from '../models/court-config.interface';
import { HandballCourtRenderer } from './handball-court-renderer.service';
import { FilterService } from '../../../pattern/filter/filter.service';

/**
 * Facade service for the tactical board
 * Responsibilities:
 * - Link filter values to reactive signals
 * - Manage Konva stage lifecycle
 * - Coordinate rendering through HandballCourtRenderer
 * - Sync filter changes to renderer
 */
@Injectable()
export class TacticalBoardStateService implements OnDestroy {
  private readonly filterService = inject(FilterService);

  // ===== Filter-linked signals =====
  public readonly pixelsPerMeter = linkedSignal<number>(() => {
    const filter = this.filterService.filters().get('pixelsPerMeter');
    return (filter?.value() as number) ?? 30;
  });

  public readonly height = linkedSignal<number>(() => {
    const filter = this.filterService.filters().get('courtHeight');
    return (filter?.value() as number) ?? 40;
  });

  public readonly showCoordinates = linkedSignal<boolean>(() => {
    const filter = this.filterService.filters().get('showCoordinates');
    return (filter?.value() as boolean) ?? true;
  });

  public readonly showBall = linkedSignal<boolean>(() => {
    const filter = this.filterService.filters().get('showBall');
    return (filter?.value() as boolean) ?? true;
  });

  public readonly fullCourt = linkedSignal<boolean>(() => {
    const filter = this.filterService.filters().get('fullCourt');
    return (filter?.value() as boolean) ?? false;
  });

  // ===== Static configuration =====
  public readonly width = signal(20); // Fixed width in meters

  // ===== Computed values =====
  public readonly effectiveHeight = computed(() =>
    this.fullCourt() ? this.height() : this.height() / 2,
  );

  // ===== Konva infrastructure =====
  private konvaContainer?: ElementRef<HTMLDivElement>;
  private _stage?: Konva.Stage;
  public readonly layer = signal<Konva.Layer>(new Konva.Layer());

  // ===== Court renderer =====
  private courtRenderer!: HandballCourtRenderer;

  /**
   * Gets the current Konva stage
   */
  public stage(): Konva.Stage | null {
    return this._stage ?? null;
  }
  constructor() {
    this.setupEffects();
  }

  /**
   * Sets up reactive effects to sync filter changes to renderer
   */
  private setupEffects(): void {
    // Effect 1: Court configuration changes (size, scale)
    effect(() => {
      const ppm = this.pixelsPerMeter();
      const h = this.height();
      const w = this.width();
      const full = this.fullCourt();

      untracked(() => {
        if (this.isInitialized()) {
          this.updateCourtConfiguration(ppm, w, h, full);
        }
      });
    });

    // Effect 2: Coordinate display toggle
    effect(() => {
      const showCoords = this.showCoordinates();
      untracked(() => {
        if (this.isInitialized()) {
          this.courtRenderer.setShowCoordinates(showCoords);
        }
      });
    });

    // Effect 3: Ball visibility toggle
    effect(() => {
      const shouldShowBall = this.showBall();
      untracked(() => {
        if (this.isInitialized()) {
          this.syncBallVisibility(shouldShowBall);
        }
      });
    });
  }
  private isInitialized(): boolean {
    return !!this.konvaContainer && !!this.courtRenderer;
  }

  ngOnDestroy(): void {
    this._stage?.destroy();
  }

  /**
   * Initializes the Konva container reference
   * Must be called by the component after view initialization
   */
  public setKonvaContainer(container: ElementRef<HTMLDivElement>): void {
    this.konvaContainer = container;
    this.initializeCourt();
  }

  /**
   * Initializes the court for the first time
   */
  private initializeCourt(): void {
    if (!this.konvaContainer) return;

    // Create stage once
    this._stage = new Konva.Stage({
      container: this.konvaContainer.nativeElement,
      width: this.width() * this.pixelsPerMeter(),
      height: this.effectiveHeight() * this.pixelsPerMeter(),
    });

    this._stage.add(this.layer());

    const config = this.buildCourtConfig();
    this.courtRenderer = new HandballCourtRenderer(
      this.layer(),
      config,
      DEFAULT_COURT_STYLES,
    );

    this.courtRenderer.setShowCoordinates(this.showCoordinates());
    this.courtRenderer.render();
    this.courtRenderer.initializeDefaultPlayers();
  }

  /**
   * Updates court configuration when filters change
   * Optimized to resize stage and reinitialize renderer while preserving entities
   */
  private updateCourtConfiguration(
    pixelsPerMeter: number,
    width: number,
    height: number,
    fullCourt: boolean,
  ): void {
    if (!this._stage) return;

    // Calculate new dimensions
    const effectiveHeight = fullCourt ? height : height / 2;
    const newWidth = width * pixelsPerMeter;
    const newHeight = effectiveHeight * pixelsPerMeter;

    // Resize stage WITHOUT recreating it
    this._stage.width(newWidth);
    this._stage.height(newHeight);

    // Rebuild config and reinitialize all entities
    const config = this.buildCourtConfig();
    this.courtRenderer.reinitialize(config, DEFAULT_COURT_STYLES);
    this.courtRenderer.setShowCoordinates(this.showCoordinates());
  }

  /**
   * Syncs ball visibility based on filter value
   */
  private syncBallVisibility(shouldShow: boolean): void {
    const hasBall = this.courtRenderer.hasBall();

    if (shouldShow && !hasBall) {
      this.courtRenderer.addBall();
    } else if (!shouldShow && hasBall) {
      this.courtRenderer.removeBall();
    }
  }

  /**
   * Builds court configuration from current signal values
   */
  private buildCourtConfig(): CourtConfig {
    return {
      widthM: this.width(),
      heightM: this.effectiveHeight(),
      pixelsPerMeter: this.pixelsPerMeter(),
      goalWidthM: DEFAULT_COURT_CONFIG.goalWidthM,
      halfCourt: !this.fullCourt(),
    };
  }
}
