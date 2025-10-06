import { CourtConfig, CourtStyles } from '../models/court-config.interface';
import {
  BackgroundEntity,
  ZoneEntity,
  LineEntity,
  CircleEntity,
} from '../models/court-shapes.model';
import { StaticEntity } from '../models/static-entity.model';

/**
 * Renders the handball court background and markings using StaticEntity system
 * Responsibilities:
 * - Create StaticEntity instances for all court elements
 * - Return entities to be added to EntityManager
 * - No direct Konva shape management!
 */
export class CourtRenderer {
  constructor(
    private config: CourtConfig,
    private styles: CourtStyles,
  ) {}

  /**
   * Updates the configuration
   */
  setConfig(config: CourtConfig): void {
    this.config = config;
  }

  /**
   * Updates the styles
   */
  setStyles(styles: CourtStyles): void {
    this.styles = styles;
  }

  /**
   * Creates all court static entities (background, zones, lines, circles)
   * @returns Array of StaticEntity instances to be added to EntityManager
   */
  createCourtEntities(): StaticEntity[] {
    const entities: StaticEntity[] = [];

    // Background
    entities.push(new BackgroundEntity(this.config, this.styles));

    // Goal areas (zones + goal lines)
    entities.push(...this.createGoalAreaEntities());

    // Center elements (line + circle for full court)
    entities.push(...this.createCenterEntities());

    return entities;
  }

  /**
   * Creates goal area entities (zones + goal lines) for both ends of the court
   */
  private createGoalAreaEntities(): StaticEntity[] {
    const entities: StaticEntity[] = [];
    const width = this.config.widthM * this.config.pixelsPerMeter;
    const height = this.config.heightM * this.config.pixelsPerMeter;
    const centerX = width / 2;

    // Top goal area (y = 0) - always render
    entities.push(...this.createSingleGoalArea(centerX, 0, false));

    // Bottom goal area (y = height) - only render in full court mode
    if (!this.config.halfCourt) {
      entities.push(...this.createSingleGoalArea(centerX, height, true));
    }

    return entities;
  }

  /**
   * Creates a single goal area (6m and 9m zones + goal line)
   */
  private createSingleGoalArea(
    centerX: number,
    yPosition: number,
    isBottom: boolean,
  ): StaticEntity[] {
    const entities: StaticEntity[] = [];

    // 6m zone (filled blue)
    entities.push(
      new ZoneEntity(
        centerX,
        yPosition,
        6,
        this.config,
        this.styles,
        isBottom,
        true,
      ),
    );

    // 9m zone (dashed line)
    entities.push(
      new ZoneEntity(
        centerX,
        yPosition,
        9,
        this.config,
        this.styles,
        isBottom,
        false,
      ),
    );

    // Goal line
    const halfGoalPx =
      (this.config.goalWidthM / 2) * this.config.pixelsPerMeter;
    const goalLinePoints = [
      centerX - halfGoalPx,
      yPosition,
      centerX + halfGoalPx,
      yPosition,
    ];

    entities.push(
      new LineEntity(
        `goal-line-${isBottom ? 'bottom' : 'top'}`,
        goalLinePoints,
        this.config,
        this.styles,
        this.styles.goalLineColor,
        this.styles.goalLineWidth,
      ),
    );

    return entities;
  }

  /**
   * Creates center line and center circle entities for full court mode
   */
  private createCenterEntities(): StaticEntity[] {
    // Skip center elements in half court mode
    if (this.config.halfCourt) {
      return [];
    }

    const entities: StaticEntity[] = [];
    const width = this.config.widthM * this.config.pixelsPerMeter;
    const height = this.config.heightM * this.config.pixelsPerMeter;

    // Center line
    const centerLinePoints = [0, height / 2, width, height / 2];
    entities.push(
      new LineEntity(
        'center-line',
        centerLinePoints,
        this.config,
        this.styles,
        this.styles.borderColor,
        this.styles.borderWidth,
      ),
    );

    // Center circle (radius = 3m in handball)
    entities.push(
      new CircleEntity(
        'center-circle',
        width / 2,
        height / 2,
        3,
        this.config,
        this.styles,
      ),
    );

    return entities;
  }
}
