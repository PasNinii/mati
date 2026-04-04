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
import {
  CourtConfig,
  DEFAULT_COURT_CONFIG,
  DEFAULT_COURT_STYLES,
} from '../models/court-config.interface';
import { HandballCourtRenderer } from './handball-court-renderer.service';
import { FilterService } from '../../../pattern/filter/filter.service';
import { KonvaStageService } from './konva-stage.service';
import { EntityManager } from './entity-manager.service';
import { DEFAULT_FORMATION } from '../models/formation-preset.model';

@Injectable()
export class TacticalBoardStateService implements OnDestroy {
  private readonly filterService = inject(FilterService);
  private readonly konvaStage = inject(KonvaStageService);
  private readonly entityManager = inject(EntityManager);

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

  public readonly width = signal(20);

  public readonly effectiveHeight = computed(() =>
    this.fullCourt() ? this.height() : this.height() / 2,
  );

  private courtRenderer!: HandballCourtRenderer;

  constructor() {
    this.setupEffects();
  }

  private setupEffects(): void {
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

    effect(() => {
      const showCoords = this.showCoordinates();
      untracked(() => {
        if (this.isInitialized()) {
          this.courtRenderer.setShowCoordinates(showCoords);
        }
      });
    });

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
    return !!this.konvaStage.stage && !!this.courtRenderer;
  }

  ngOnDestroy(): void {
    // KonvaStageService handles its own cleanup via ngOnDestroy
  }

  public setKonvaContainer(container: ElementRef<HTMLDivElement>): void {
    this.konvaStage.initStage(
      container,
      this.width() * this.pixelsPerMeter(),
      this.effectiveHeight() * this.pixelsPerMeter(),
    );
    this.initializeCourt();
  }

  private initializeCourt(): void {
    const config = this.buildCourtConfig();
    this.courtRenderer = new HandballCourtRenderer(
      this.konvaStage.layer(),
      this.entityManager,
      config,
      DEFAULT_COURT_STYLES,
    );

    this.courtRenderer.setShowCoordinates(this.showCoordinates());
    this.courtRenderer.render();
    this.courtRenderer.loadFormation(
      DEFAULT_FORMATION.entities,
      DEFAULT_FORMATION.positions,
    );
  }

  private updateCourtConfiguration(
    pixelsPerMeter: number,
    width: number,
    height: number,
    fullCourt: boolean,
  ): void {
    const effectiveHeight = fullCourt ? height : height / 2;
    const newWidth = width * pixelsPerMeter;
    const newHeight = effectiveHeight * pixelsPerMeter;

    this.konvaStage.resize(newWidth, newHeight);

    const config = this.buildCourtConfig();
    this.courtRenderer.reinitialize(config, DEFAULT_COURT_STYLES);
    this.courtRenderer.setShowCoordinates(this.showCoordinates());
  }

  private syncBallVisibility(shouldShow: boolean): void {
    const hasBall = this.courtRenderer.hasBall();

    if (shouldShow && !hasBall) {
      this.courtRenderer.addBall();
    } else if (!shouldShow && hasBall) {
      this.courtRenderer.removeBall();
    }
  }

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
