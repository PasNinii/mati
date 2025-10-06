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
import { EntityRenderer } from './entity-renderer.service';
import { StatePersistence } from './state-persistence.service';

// Re-export styles for backward compatibility
export { DEFAULT_PLAYER_STYLES, PlayerStyles, DEFAULT_BALL_STYLES, BallStyles };

/**
 * Orchestrates handball court rendering and entity management
 * This is a facade that coordinates specialized services:
 * - CourtRenderer: Draws court background and markings
 * - EntityManager: Manages entity lifecycle
 * - EntityRenderer: Renders entities
 * - StatePersistence: Handles state save/restore
 */
export class HandballCourtRenderer {
  private entityManager: EntityManager;
  private courtRenderer: CourtRenderer;
  private entityRenderer: EntityRenderer;
  private statePersistence: StatePersistence;

  constructor(
    private layer: Konva.Layer,
    private config: CourtConfig,
    private styles: CourtStyles,
  ) {
    // Initialize specialized services
    this.entityManager = new EntityManager();
    this.courtRenderer = new CourtRenderer(layer, config, styles);
    this.entityRenderer = new EntityRenderer(
      layer,
      this.entityManager,
      config.pixelsPerMeter,
    );
    this.statePersistence = new StatePersistence(this.entityManager);
  }

  /**
   * Renders the complete handball court
   */
  render(): void {
    this.courtRenderer.render();
    this.entityRenderer.renderAll();
    this.layer.draw();
  }

  /**
   * Initialize default players (6 players per team in attack and defense)
   * Players are always positioned in the upper part of the court (from y=0)
   * regardless of half or full court mode.
   * Optimized to batch all additions and draw once at the end.
   */
  initializeDefaultPlayers(): void {
    const pixelsPerMeter = this.config.pixelsPerMeter;

    // Add home team attack players (batched)
    Object.entries(DEFAULT_ATTACK_POSITIONS).forEach(([position, coords]) => {
      const player = new Player(
        Team.HOME,
        PlayerRole.ATTACK,
        position as AttackPosition,
        {
          x: coords.xMeters * pixelsPerMeter,
          y: coords.yMeters * pixelsPerMeter,
        },
        true,
        DEFAULT_PLAYER_STYLES,
      );
      this.addEntity(player, true); // Batch mode - no draw yet
    });

    // Add away team defense players (batched)
    DEFAULT_DEFENSE_POSITIONS.forEach((posData) => {
      const player = new Player(
        Team.AWAY,
        PlayerRole.DEFENSE,
        posData.position,
        {
          x: posData.xMeters * pixelsPerMeter,
          y: posData.yMeters * pixelsPerMeter,
        },
        true,
        DEFAULT_PLAYER_STYLES,
      );
      this.addEntity(player, true); // Batch mode - no draw yet
    });

    // Initialize ball at CB (Center Back) attack position by default
    const cbPosition = DEFAULT_ATTACK_POSITIONS[AttackPosition.CB];
    const ballX = cbPosition.xMeters * pixelsPerMeter;
    const ballY = cbPosition.yMeters * pixelsPerMeter;
    this.addBall(ballX, ballY);

    // Single draw for all entities added
    this.layer.draw();
  }

  /**
   * Adds a new entity to the court
   * Note: Batches rendering - only draws if batchDraw is false
   */
  addEntity(entity: CourtEntity, batchDraw: boolean = false): void {
    this.entityRenderer.addAndRender(entity);
    if (!batchDraw) {
      this.layer.draw();
    }
  }

  /**
   * Removes an entity from the court
   */
  removeEntity(entityId: string): void {
    const removed = this.entityManager.remove(entityId);
    if (removed) {
      this.layer.draw();
    }
  }

  /**
   * Gets all entities of a specific type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEntities<T extends CourtEntity>(type: new (...args: any[]) => T): T[] {
    return this.entityManager.getByType(type);
  }

  /**
   * Gets all current players
   */
  getPlayers(): Player[] {
    return this.entityManager.getPlayers();
  }

  /**
   * Clears all entities from the court
   */
  clearEntities(): void {
    this.entityManager.clear();
    this.layer.draw();
  }

  /**
   * Sets whether to show entity coordinates
   * Optimized to only redraw if changes were made
   */
  setShowCoordinates(show: boolean): void {
    const changed = this.entityRenderer.setShowCoordinates(show);
    if (changed) {
      this.layer.draw();
    }
  }

  /**
   * Clears the court and re-renders with new configuration
   */
  refresh(config?: CourtConfig, styles?: CourtStyles): void {
    if (config) {
      this.config = config;
      this.courtRenderer.setConfig(config);
      this.entityRenderer.setPixelsPerMeter(config.pixelsPerMeter);
    }
    if (styles) {
      this.styles = styles;
      this.courtRenderer.setStyles(styles);
    }

    this.layer.destroyChildren();
    this.entityManager.clear();
    this.render();
  }

  /**
   * Adds the ball to the court at a specific position
   */
  addBall(x?: number, y?: number, batchDraw: boolean = false): void {
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

    this.addEntity(ball, batchDraw);
  }

  /**
   * Removes the ball from the court
   */
  removeBall(): void {
    const balls = this.entityManager.getByType(Ball);
    balls.forEach((ball) => this.removeEntity(ball.id));
  }

  /**
   * Gets the current ball
   */
  getBall(): Ball | null {
    return this.entityManager.getBall();
  }

  /**
   * Checks if the ball is currently on the court
   */
  hasBall(): boolean {
    return this.entityManager.hasBall();
  }

  /**
   * Saves the current state of all entities (positions in meters)
   * Returns an array of objects with entity type and serialized state
   */
  saveEntitiesState(): Array<{ type: string; state: Record<string, unknown> }> {
    return this.statePersistence.saveState(this.config.pixelsPerMeter);
  }

  /**
   * Restores entities from saved state
   * Optimized to batch all entity additions and draw once
   */
  restoreEntitiesState(
    savedState: Array<{ type: string; state: Record<string, unknown> }>,
    newPixelsPerMeter: number,
  ): void {
    // Clear existing entities (no draw needed)
    this.entityManager.clear();

    // Restore entities
    const restoredEntities = this.statePersistence.restoreState(
      savedState,
      newPixelsPerMeter,
    );

    // Batch render all entities without drawing
    restoredEntities.forEach((entity) => {
      const shape = this.entityRenderer.renderEntity(entity);
      this.entityManager.add(entity, shape);
    });

    // Single draw for all restored entities
    this.layer.draw();
  }

  /**
   * Reinitializes the court with a new configuration while preserving entities
   */
  reinitialize(newConfig: CourtConfig, newStyles?: CourtStyles): void {
    // Save current entities state
    const savedState = this.saveEntitiesState();

    // Update configuration
    this.config = newConfig;
    this.courtRenderer.setConfig(newConfig);
    this.entityRenderer.setPixelsPerMeter(newConfig.pixelsPerMeter);

    if (newStyles) {
      this.styles = newStyles;
      this.courtRenderer.setStyles(newStyles);
    }

    // Clear the layer
    this.layer.destroyChildren();
    this.entityManager.clear();

    // Re-render court background
    this.courtRenderer.render();

    // Restore entities with new scale
    if (savedState.length > 0) {
      this.restoreEntitiesState(savedState, newConfig.pixelsPerMeter);
    }
  }
}
