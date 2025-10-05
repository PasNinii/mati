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
import { FilterService } from '../../../core/services/filter.service';

@Injectable()
export class TacticalBoardStateService implements OnDestroy {
  private readonly filterService = inject(FilterService);

  // State signals - directly linked to filter values
  public readonly pixelsPerMeter = linkedSignal<number>(() => {
    const filter = this.filterService.filters().get('pixelsPerMeter');
    return (filter?.value() as number) ?? 30;
  });

  public readonly height = linkedSignal<number>(() => {
    const filter = this.filterService.filters().get('courtHeight');
    return (filter?.value() as number) ?? 40;
  });

  public readonly width = signal(20); // Not yet in filters

  public readonly fullCourt = signal(false); // Not yet in filters

  public readonly showCoordinates = linkedSignal<boolean>(() => {
    const filter = this.filterService.filters().get('showCoordinates');
    return (filter?.value() as boolean) ?? true;
  });

  public readonly showBall = linkedSignal<boolean>(() => {
    const filter = this.filterService.filters().get('showBall');
    return (filter?.value() as boolean) ?? true;
  });

  // Derived state
  public readonly playerCount = signal(0);
  public readonly effectiveHeight = computed(() =>
    this.fullCourt() ? this.height() : this.height() / 2,
  );

  // Konva objects
  private konvaContainer?: ElementRef<HTMLDivElement>;
  public readonly stage = linkedSignal<Konva.Stage | null>(() => {
    if (!this.konvaContainer) return null;

    return new Konva.Stage({
      container: this.konvaContainer.nativeElement,
      width: this.width() * this.pixelsPerMeter(),
      height: this.effectiveHeight() * this.pixelsPerMeter(),
    });
  });

  public readonly layer = signal<Konva.Layer>(new Konva.Layer());
  private courtRenderer?: HandballCourtRenderer;

  constructor() {
    // Watch for court configuration changes and re-render
    effect(() => {
      // Track these signals to trigger re-render on changes
      this.pixelsPerMeter();
      this.height();
      this.width();
      this.fullCourt();

      untracked(() => {
        if (this.konvaContainer) {
          this.initializeAndRenderCourt();
        }
      });
    });

    // Watch for coordinate display toggle
    effect(() => {
      const showCoords = this.showCoordinates();
      untracked(() => {
        if (this.courtRenderer) {
          this.courtRenderer.setShowCoordinates(showCoords);
        }
      });
    });

    // Watch for ball visibility toggle
    effect(() => {
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
   * Initializes the Konva container reference
   * Must be called by the component after view initialization
   */
  public setKonvaContainer(container: ElementRef<HTMLDivElement>): void {
    this.konvaContainer = container;
    this.initializeAndRenderCourt();
  }

  /**
   * Initializes Konva stage and renders the handball court
   */
  private initializeAndRenderCourt(): void {
    if (!this.konvaContainer) return;

    const currentStage = this.stage();
    if (currentStage) {
      currentStage.add(this.layer());

      const config = this.buildCourtConfig();
      const styles = DEFAULT_COURT_STYLES;

      this.courtRenderer = new HandballCourtRenderer(
        this.layer(),
        config,
        styles,
      );

      // Set initial showCoordinates state
      this.courtRenderer.setShowCoordinates(this.showCoordinates());

      // Initialize players by default
      this.courtRenderer.initializeDefaultPlayers();
      this.courtRenderer.render();
      this.updatePlayerCount();
    }
  }

  /**
   * Adds the ball to the court at the center position
   */
  private addBall(): void {
    if (!this.courtRenderer) return;
    this.courtRenderer.addBall();
  }

  /**
   * Removes the ball from the court
   */
  private removeBall(): void {
    if (!this.courtRenderer) return;
    this.courtRenderer.removeBall();
  }

  /**
   * Checks if the ball is currently on the court
   */
  private hasBall(): boolean {
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
    return {
      widthM: this.width(),
      heightM: this.effectiveHeight(),
      pixelsPerMeter: this.pixelsPerMeter(),
      goalWidthM: DEFAULT_COURT_CONFIG.goalWidthM,
      halfCourt: !this.fullCourt(), // Pass half court flag to renderer
    };
  }
}
