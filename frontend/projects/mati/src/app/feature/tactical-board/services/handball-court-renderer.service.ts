import Konva from 'konva';
import { CourtConfig, CourtStyles } from '../models/court-config.interface';
import {
  Player,
  Team,
  PlayerRole,
  AttackPosition,
  DEFAULT_ATTACK_POSITIONS,
  DEFAULT_DEFENSE_POSITIONS,
  DEFAULT_PLAYER_STYLES,
  PlayerStyles,
} from '../models/player.model';
import { Ball, DEFAULT_BALL_STYLES, BallStyles } from '../models/ball.model';
import { MovingEntity } from '../models/moving-entity.model';
import { StaticEntity } from '../models/static-entity.model';
import { EntityManager } from './entity-manager.service';
import { CourtRenderer } from './court-renderer.service';

// Re-export styles for backward compatibility
export { DEFAULT_PLAYER_STYLES, PlayerStyles, DEFAULT_BALL_STYLES, BallStyles };

/**
 * Orchestrates handball court rendering and entity management
 * Responsibilities:
 * - Coordinate court background rendering (via CourtRenderer)
 * - Manage entity lifecycle (via EntityManager)
 * - Render entities directly
 * - Handle configuration changes with minimal redraws
 */
export class HandballCourtRenderer {
  private entityManager: EntityManager;
  private courtRenderer: CourtRenderer;
  private showCoordinates: boolean = false;

  constructor(
    private layer: Konva.Layer,
    private config: CourtConfig,
    private styles: CourtStyles,
  ) {
    this.entityManager = new EntityManager();
    this.courtRenderer = new CourtRenderer(config, styles);
  }

  /**
   * Renders the complete handball court (creates and adds all static court entities)
   * Call initializeDefaultPlayers() after this to add moving entities
   */
  render(): void {
    // Create and add static court entities (background, zones, lines, circles)
    const courtEntities = this.courtRenderer.createCourtEntities();
    courtEntities.forEach((entity) => {
      const shape = entity.createShape({
        pixelsPerMeter: this.config.pixelsPerMeter,
      });
      this.layer.add(shape);
      this.entityManager.add(entity, shape);
    });
  }

  /**
   * Initialize default players (6 players per team in attack and defense)
   * Optimized: All entities created, then single draw
   */
  initializeDefaultPlayers(): void {
    const pixelsPerMeter = this.config.pixelsPerMeter;
    const entities: (Player | Ball)[] = [];

    // Create home team attack players
    Object.entries(DEFAULT_ATTACK_POSITIONS).forEach(([position, coords]) => {
      entities.push(
        new Player(
          Team.HOME,
          PlayerRole.ATTACK,
          position as AttackPosition,
          {
            x: coords.xMeters * pixelsPerMeter,
            y: coords.yMeters * pixelsPerMeter,
          },
          true,
          DEFAULT_PLAYER_STYLES,
        ),
      );
    });

    // Create away team defense players
    DEFAULT_DEFENSE_POSITIONS.forEach((posData) => {
      entities.push(
        new Player(
          Team.AWAY,
          PlayerRole.DEFENSE,
          posData.position,
          {
            x: posData.xMeters * pixelsPerMeter,
            y: posData.yMeters * pixelsPerMeter,
          },
          true,
          DEFAULT_PLAYER_STYLES,
        ),
      );
    });

    // Create ball at CB position
    const cbPosition = DEFAULT_ATTACK_POSITIONS[AttackPosition.CB];
    entities.push(
      new Ball(
        {
          x: cbPosition.xMeters * pixelsPerMeter,
          y: cbPosition.yMeters * pixelsPerMeter,
        },
        true,
        DEFAULT_BALL_STYLES,
      ),
    );

    // Batch add all entities
    entities.forEach((entity) => {
      const shape = entity.createShape({
        pixelsPerMeter: this.config.pixelsPerMeter,
        showCoordinates: this.showCoordinates,
      });
      this.layer.add(shape);
      this.entityManager.add(entity, shape);
    });
  }

  /**
   * Adds a new entity to the court
   */
  private addEntity(entity: Player | Ball): void {
    const shape = entity.createShape({
      pixelsPerMeter: this.config.pixelsPerMeter,
      showCoordinates: this.showCoordinates,
    });
    this.layer.add(shape);
    this.entityManager.add(entity, shape);
    // Note: Caller responsible for layer.draw() to allow batching
  }

  /**
   * Gets all current players
   */
  getPlayers(): Player[] {
    return this.entityManager.getPlayers();
  }

  /**
   * Sets whether to show entity coordinates
   */
  setShowCoordinates(show: boolean): void {
    this.showCoordinates = show;
    this.entityManager.getAll().forEach((entity) => {
      if (entity instanceof MovingEntity) {
        entity.setCoordinatesVisible(show);
      }
    });
  }
  /**
   * Adds the ball to the court at a specific position
   */
  addBall(x?: number, y?: number): void {
    // Remove existing ball first (without redraw)
    const balls = this.entityManager.getByType(Ball);
    balls.forEach((ball) => this.entityManager.remove(ball));

    // Default position: center of the court
    const defaultX = (this.config.widthM * this.config.pixelsPerMeter) / 2;
    const defaultY = (this.config.heightM * this.config.pixelsPerMeter) / 2;

    const ball = new Ball(
      { x: x ?? defaultX, y: y ?? defaultY },
      true,
      DEFAULT_BALL_STYLES,
    );

    this.addEntity(ball);
    // Note: Caller responsible for layer.draw()
  }

  /**
   * Removes the ball from the court
   */
  removeBall(): void {
    const balls = this.entityManager.getByType(Ball);
    balls.forEach((ball) => this.entityManager.remove(ball));
    // Note: Caller responsible for layer.draw()
  }

  /**
   * Checks if the ball is currently on the court
   */
  hasBall(): boolean {
    return this.entityManager.hasBall();
  }

  /**
   * Reinitializes the court with a new configuration
   * Uses the unified entity system: all entities (static and moving) update themselves
   * NO shape destruction or recreation - just geometric updates!
   */
  reinitialize(newConfig: CourtConfig, newStyles?: CourtStyles): void {
    const oldPixelsPerMeter = this.config.pixelsPerMeter;
    const newPixelsPerMeter = newConfig.pixelsPerMeter;
    const scaleFactor = newPixelsPerMeter / oldPixelsPerMeter;

    // Update configuration
    this.config = newConfig;
    this.courtRenderer.setConfig(newConfig);

    if (newStyles) {
      this.styles = newStyles;
      this.courtRenderer.setStyles(newStyles);
    }

    // Update ALL entities using their updateShape method
    // This is the unified approach: zones, lines, circles, players, ball all update consistently
    this.entityManager.getAll().forEach((entity) => {
      // Update config/styles for static entities
      if (entity instanceof StaticEntity) {
        entity.setConfig(newConfig);
        if (newStyles) {
          entity.setStyles(newStyles);
        }
      }

      // Update shape geometry
      entity.updateShape(newPixelsPerMeter, scaleFactor);
    });
  }
}
