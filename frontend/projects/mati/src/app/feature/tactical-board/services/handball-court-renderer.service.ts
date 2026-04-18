import Konva from 'konva';
import { CourtConfig, CourtStyles } from '../models/court-config.interface';
import {
  Player,
  Team,
  PlayerRole,
  PlayerPosition,
  DEFAULT_PLAYER_STYLES,
} from '../models/player.model';
import { Ball, DEFAULT_BALL_STYLES } from '../models/ball.model';
import { MovingEntity } from '../models/moving-entity.model';
import { StaticEntity } from '../models/static-entity.model';
import { EntityManager } from './entity-manager.service';
import { CourtRenderer } from './court-renderer.service';
import { EntityDefinition } from '../models/scenario.model';

/**
 * Orchestrates handball court rendering and entity management
 * Responsibilities:
 * - Coordinate court background rendering (via CourtRenderer)
 * - Manage entity lifecycle (via EntityManager)
 * - Render entities directly
 * - Handle configuration changes with minimal redraws
 */
export class HandballCourtRenderer {
  private courtRenderer: CourtRenderer;
  private showCoordinates: boolean = false;

  constructor(
    private layer: Konva.Layer,
    private entityManager: EntityManager,
    private config: CourtConfig,
    private styles: CourtStyles,
  ) {
    this.courtRenderer = new CourtRenderer(config, styles);
  }

  /**
   * Renders the complete handball court (creates and adds all static court entities)
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
   * Loads a formation from entity definitions and positions
   */
  loadFormation(
    entities: EntityDefinition[],
    positions: Record<string, { x: number; y: number }>,
  ): void {
    const ppm = this.config.pixelsPerMeter;

    entities.forEach((def) => {
      const pos = positions[def.id];
      if (!pos) return;

      const coords = { x: pos.x * ppm, y: pos.y * ppm };

      let entity: MovingEntity;
      if (def.type === 'ball') {
        entity = new Ball(coords, true, DEFAULT_BALL_STYLES);
      } else {
        entity = new Player(
          def.id,
          (def.team as Team) ?? Team.HOME,
          (def.role as PlayerRole) ?? PlayerRole.ATTACK,
          (def.position as PlayerPosition) ?? 'CB',
          coords,
          true,
          DEFAULT_PLAYER_STYLES,
        );
      }

      const shape = entity.createShape({
        pixelsPerMeter: ppm,
        showCoordinates: this.showCoordinates,
      });
      this.layer.add(shape);
      this.entityManager.add(entity, shape);
    });
  }

  /**
   * Returns the current court config
   */
  getConfig(): CourtConfig {
    return this.config;
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
   * Reinitializes the court with a new configuration.
   * When halfCourt mode changes, static entities (zones, goals, center line) are
   * rebuilt since the set of entities differs between modes.
   * Moving entities (players, ball) are always preserved and rescaled.
   */
  reinitialize(newConfig: CourtConfig, newStyles?: CourtStyles): void {
    const oldPixelsPerMeter = this.config.pixelsPerMeter;
    const newPixelsPerMeter = newConfig.pixelsPerMeter;
    const scaleFactor = newPixelsPerMeter / oldPixelsPerMeter;
    const courtModeChanged = this.config.halfCourt !== newConfig.halfCourt;

    this.config = newConfig;
    this.courtRenderer.setConfig(newConfig);

    if (newStyles) {
      this.styles = newStyles;
      this.courtRenderer.setStyles(newStyles);
    }

    if (courtModeChanged) {
      // Court mode changed: rebuild static entities, preserve moving entities
      this.entityManager
        .getAll()
        .filter((entity) => entity instanceof StaticEntity)
        .forEach((entity) => {
          this.entityManager.remove(entity);
        });

      const courtEntities = this.courtRenderer.createCourtEntities();
      courtEntities.forEach((entity) => {
        const shape = entity.createShape({
          pixelsPerMeter: newPixelsPerMeter,
        });
        this.layer.add(shape);
        this.entityManager.add(entity, shape);
      });

      // Rescale moving entities and move them above the new static shapes
      this.entityManager.getAll().forEach((entity) => {
        if (entity instanceof MovingEntity) {
          entity.updateShape(newPixelsPerMeter, scaleFactor);
          entity.getShape()?.moveToTop();
        }
      });
    } else {
      // Same mode: update all entities in place
      this.entityManager.getAll().forEach((entity) => {
        if (entity instanceof StaticEntity) {
          entity.setConfig(newConfig);
          if (newStyles) {
            entity.setStyles(newStyles);
          }
        }
        entity.updateShape(newPixelsPerMeter, scaleFactor);
      });
    }
  }
}
