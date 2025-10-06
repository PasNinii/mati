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
import { CourtEntity } from '../models/court-entity.model';
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

  constructor(
    private layer: Konva.Layer,
    private config: CourtConfig,
    private styles: CourtStyles,
  ) {
    this.entityManager = new EntityManager();
    this.courtRenderer = new CourtRenderer(layer, config, styles);
  }

  /**
   * Renders the complete handball court (court + all entities)
   * Single draw at the end
   */
  render(): void {
    this.courtRenderer.render();
    
    // Render all entities
    this.entityManager.getAll().forEach((entity) => {
      const shape = entity.createShape({
        pixelsPerMeter: this.config.pixelsPerMeter,
        showCoordinates: false, // Default off
      });
      this.layer.add(shape);
      this.entityManager.add(entity, shape);
    });
    
    this.layer.draw();
  }

  /**
   * Initialize default players (6 players per team in attack and defense)
   * Optimized: All entities created, then single draw
   */
  initializeDefaultPlayers(): void {
    const pixelsPerMeter = this.config.pixelsPerMeter;
    const entities: CourtEntity[] = [];

    // Create home team attack players
    Object.entries(DEFAULT_ATTACK_POSITIONS).forEach(([position, coords]) => {
      entities.push(new Player(
        Team.HOME,
        PlayerRole.ATTACK,
        position as AttackPosition,
        {
          x: coords.xMeters * pixelsPerMeter,
          y: coords.yMeters * pixelsPerMeter,
        },
        true,
        DEFAULT_PLAYER_STYLES,
      ));
    });

    // Create away team defense players
    DEFAULT_DEFENSE_POSITIONS.forEach((posData) => {
      entities.push(new Player(
        Team.AWAY,
        PlayerRole.DEFENSE,
        posData.position,
        {
          x: posData.xMeters * pixelsPerMeter,
          y: posData.yMeters * pixelsPerMeter,
        },
        true,
        DEFAULT_PLAYER_STYLES,
      ));
    });

    // Create ball at CB position
    const cbPosition = DEFAULT_ATTACK_POSITIONS[AttackPosition.CB];
    entities.push(new Ball(
      {
        x: cbPosition.xMeters * pixelsPerMeter,
        y: cbPosition.yMeters * pixelsPerMeter,
      },
      true,
      DEFAULT_BALL_STYLES,
    ));

    // Batch add all entities
    entities.forEach(entity => {
      const shape = entity.createShape({
        pixelsPerMeter: this.config.pixelsPerMeter,
        showCoordinates: false,
      });
      this.layer.add(shape);
      this.entityManager.add(entity, shape);
    });
    
    // Single draw for everything
    this.layer.draw();
  }

  /**
   * Adds a new entity to the court
   */
  addEntity(entity: CourtEntity): void {
    const shape = entity.createShape({
      pixelsPerMeter: this.config.pixelsPerMeter,
      showCoordinates: false, // Will be updated if needed
    });
    this.layer.add(shape);
    this.entityManager.add(entity, shape);
    // Note: Caller responsible for layer.draw() to allow batching
  }

  /**
   * Removes an entity from the court
   */
  removeEntity(entityId: string): void {
    this.entityManager.remove(entityId);
    // Note: Caller responsible for layer.draw()
  }

  /**
   * Gets all current players
   */
  getPlayers(): Player[] {
    return this.entityManager.getPlayers();
  }

  /**
   * Sets whether to show entity coordinates
   * Returns true if any changes were made
   */
  setShowCoordinates(show: boolean): boolean {
    let changed = false;
    this.entityManager.getAll().forEach((entity) => {
      if (entity.setCoordinatesVisible(show)) {
        changed = true;
      }
    });
    return changed;
  }  /**
   * Adds the ball to the court at a specific position
   */
  addBall(x?: number, y?: number): void {
    // Remove existing ball first (without redraw)
    const balls = this.entityManager.getByType(Ball);
    balls.forEach((ball) => this.entityManager.remove(ball.id));

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
    balls.forEach((ball) => this.entityManager.remove(ball.id));
    // Note: Caller responsible for layer.draw()
  }

  /**
   * Checks if the ball is currently on the court
   */
  hasBall(): boolean {
    return this.entityManager.hasBall();
  }

  /**
   * Reinitializes the court with a new configuration while preserving entities
   * Optimized: Only redraws court background and scales entities in place
   * NO entity destruction or recreation - just position updates!
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

    // Only destroy and redraw court background (not entities!)
    this.layer.find('.court-background, .court-goal-area, .court-center').forEach(node => node.destroy());
    this.courtRenderer.render();

    // Scale entity positions in place using Konva's update methods
    this.entityManager.getAllEntries().forEach(({ entity, shape }) => {
      // Update position directly on shape (Konva handles the visual update)
      shape.x(shape.x() * scaleFactor);
      shape.y(shape.y() * scaleFactor);
      
      // Sync entity's internal coordinates
      entity.updateCoordinates(shape.x(), shape.y());
      
      // Update coordinate text display (if visible)
      entity.updateCoordinateText(newPixelsPerMeter);
    });

    // Single redraw for everything
    this.layer.draw();
  }
}
