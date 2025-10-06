import Konva from 'konva';
import { CourtConfig, CourtStyles } from '../models/court-config.interface';
import { HandballZone } from '../models/handball-zone';
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

// Re-export styles for backward compatibility
export { DEFAULT_PLAYER_STYLES, PlayerStyles, DEFAULT_BALL_STYLES, BallStyles };

/**
 * Entity entry in the tracking map
 */
interface EntityEntry {
  entity: CourtEntity;
  shape: Konva.Group;
}

/**
 * Renders a complete handball court with all its elements:
 * - Court background and borders
 * - Goal areas (6m and 9m zones)
 * - Goal lines
 * - Center line and circle
 * - Players (attack and defense)
 */
export class HandballCourtRenderer {
  private layer: Konva.Layer;
  private config: CourtConfig;
  private styles: CourtStyles;
  private entities: Map<string, EntityEntry> = new Map();
  private showCoordinates: boolean = false;

  constructor(layer: Konva.Layer, config: CourtConfig, styles: CourtStyles) {
    this.layer = layer;
    this.config = config;
    this.styles = styles;
    // Styles are now passed to entities during creation
  }

  /**
   * Renders the complete handball court
   */
  render(): void {
    this.renderCourtBackground();
    this.renderGoalAreas();
    this.renderCenterElements();
    this.renderEntities();
    this.layer.draw();
  }

  /**
   * Initialize default players (6 players per team in attack and defense)
   * Players are always positioned in the upper part of the court (from y=0)
   * regardless of half or full court mode.
   */
  initializeDefaultPlayers(): void {
    const pixelsPerMeter = this.config.pixelsPerMeter;

    // Add home team attack players
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
      this.addEntity(player);
    });

    // Add away team defense players
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
      this.addEntity(player);
    });

    // Initialize ball at CB (Center Back) attack position by default
    const cbPosition = DEFAULT_ATTACK_POSITIONS[AttackPosition.CB];
    const ballX = cbPosition.xMeters * pixelsPerMeter;
    const ballY = cbPosition.yMeters * pixelsPerMeter;
    this.addBall(ballX, ballY);
  }

  /**
   * Renders the court background and border
   */
  private renderCourtBackground(): void {
    const width = this.config.widthM * this.config.pixelsPerMeter;
    const height = this.config.heightM * this.config.pixelsPerMeter;

    const background = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: this.styles.courtColor,
      stroke: this.styles.borderColor,
      strokeWidth: this.styles.borderWidth,
    });

    this.layer.add(background);
  }

  /**
   * Renders goal areas (6m and 9m zones) for both ends of the court
   */
  private renderGoalAreas(): void {
    const width = this.config.widthM * this.config.pixelsPerMeter;
    const height = this.config.heightM * this.config.pixelsPerMeter;
    const centerX = width / 2;

    // Top goal area (y = 0) - always render
    this.renderSingleGoalArea(centerX, 0, false);

    // Bottom goal area (y = height) - only render in full court mode
    if (!this.config.halfCourt) {
      this.renderSingleGoalArea(centerX, height, true);
    }
  }

  /**
   * Renders a single goal area (6m and 9m zones + goal line)
   * @param centerX X coordinate of the goal center
   * @param yPosition Y coordinate of the goal line
   * @param isBottom Whether this is the bottom goal area
   */
  private renderSingleGoalArea(
    centerX: number,
    yPosition: number,
    isBottom: boolean,
  ): void {
    // Create and render 6m zone (filled blue)
    const zone6m = new HandballZone(
      centerX,
      yPosition,
      6,
      this.config,
      isBottom,
    );
    const zone6mShape = zone6m.createShape(this.styles, true);
    this.layer.add(zone6mShape);

    // Create and render 9m zone (dashed line)
    const zone9m = new HandballZone(
      centerX,
      yPosition,
      9,
      this.config,
      isBottom,
    );
    const zone9mShape = zone9m.createShape(this.styles, false);
    this.layer.add(zone9mShape);

    // Render goal line
    this.renderGoalLine(centerX, yPosition);
  }

  /**
   * Renders the goal line (3m wide, centered)
   */
  private renderGoalLine(centerX: number, yPosition: number): void {
    const halfGoalPx =
      (this.config.goalWidthM / 2) * this.config.pixelsPerMeter;

    const goalLine = new Konva.Line({
      points: [
        centerX - halfGoalPx,
        yPosition,
        centerX + halfGoalPx,
        yPosition,
      ],
      stroke: this.styles.goalLineColor,
      strokeWidth: this.styles.goalLineWidth,
    });

    this.layer.add(goalLine);
  }

  /**
   * Renders center line and center circle
   */
  private renderCenterElements(): void {
    // Skip center elements in half court mode
    // In half court mode, the bottom border represents the center/medium line
    if (this.config.halfCourt) {
      return;
    }

    const width = this.config.widthM * this.config.pixelsPerMeter;
    const height = this.config.heightM * this.config.pixelsPerMeter;

    // Center line
    const centerLine = new Konva.Line({
      points: [0, height / 2, width, height / 2],
      stroke: this.styles.borderColor,
      strokeWidth: this.styles.borderWidth,
    });
    this.layer.add(centerLine);

    // Center circle (radius = 3m in handball)
    const centerCircleRadius = 3 * this.config.pixelsPerMeter;
    const centerCircle = new Konva.Circle({
      x: width / 2,
      y: height / 2,
      radius: centerCircleRadius,
      stroke: this.styles.borderColor,
      strokeWidth: this.styles.borderWidth,
      fill: 'transparent',
    });
    this.layer.add(centerCircle);
  }

  /**
   * Renders all entities on the court (players, ball, etc.)
   */
  private renderEntities(): void {
    this.entities.forEach(({ entity }) => {
      this.renderEntity(entity);
    });
  }

  /**
   * Renders a single entity using polymorphic createShape method
   * Returns the created shape
   */
  private renderEntity(entity: CourtEntity): Konva.Group {
    const shape = entity.createShape({
      pixelsPerMeter: this.config.pixelsPerMeter,
      showCoordinates: this.showCoordinates,
    });

    this.layer.add(shape);
    return shape;
  }

  /**
   * Adds a new entity to the court
   */
  addEntity(entity: CourtEntity): void {
    const shape = this.renderEntity(entity);
    this.entities.set(entity.id, { entity, shape });
    this.layer.draw();
  }

  /**
   * Removes an entity from the court
   */
  removeEntity(entityId: string): void {
    const entry = this.entities.get(entityId);
    if (entry) {
      entry.shape.destroy();
      this.entities.delete(entityId);
      this.layer.draw();
    }
  }

  /**
   * Gets all entities of a specific type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEntities<T extends CourtEntity>(type: new (...args: any[]) => T): T[] {
    const result: T[] = [];
    this.entities.forEach(({ entity }) => {
      if (entity instanceof type) {
        result.push(entity as T);
      }
    });
    return result;
  }

  /**
   * Gets all current players
   */
  getPlayers(): Player[] {
    return this.getEntities(Player);
  }

  /**
   * Clears all entities from the court
   */
  clearEntities(): void {
    this.entities.forEach(({ shape }) => shape.destroy());
    this.entities.clear();
    this.layer.draw();
  }

  /**
   * Sets whether to show entity coordinates
   */
  setShowCoordinates(show: boolean): void {
    this.showCoordinates = show;
    // Re-render all entities to update coordinate display
    this.entities.forEach(({ entity, shape }) => {
      shape.destroy();
      const newShape = this.renderEntity(entity);
      this.entities.set(entity.id, { entity, shape: newShape });
    });
    this.layer.draw();
  }

  /**
   * Clears the court and re-renders with new configuration
   */
  refresh(config?: CourtConfig, styles?: CourtStyles): void {
    if (config) this.config = config;
    if (styles) this.styles = styles;

    this.layer.destroyChildren();
    this.entities.clear();
    this.render();
  }

  /**
   * Adds the ball to the court at a specific position
   */
  addBall(x?: number, y?: number): void {
    // Remove existing ball first
    this.removeBall();

    // Default position: center of the court
    const defaultX = (this.config.widthM * this.config.pixelsPerMeter) / 2;
    const defaultY = (this.config.heightM * this.config.pixelsPerMeter) / 2;

    const ball = new Ball(
      { x: x ?? defaultX, y: y ?? defaultY },
      true,
      DEFAULT_BALL_STYLES,
    );

    this.addEntity(ball);
  }

  /**
   * Removes the ball from the court
   */
  removeBall(): void {
    const balls = this.getEntities(Ball);
    balls.forEach((ball) => this.removeEntity(ball.id));
  }

  /**
   * Gets the current ball
   */
  getBall(): Ball | null {
    const balls = this.getEntities(Ball);
    return balls.length > 0 ? balls[0] : null;
  }

  /**
   * Checks if the ball is currently on the court
   */
  hasBall(): boolean {
    return this.getEntities(Ball).length > 0;
  }

  /**
   * Saves the current state of all entities (positions in meters)
   * Returns an array of objects with entity type and serialized state
   */
  saveEntitiesState(): Array<{ type: string; state: Record<string, unknown> }> {
    const result: Array<{ type: string; state: Record<string, unknown> }> = [];
    this.entities.forEach(({ entity }) => {
      const type =
        entity instanceof Player
          ? 'player'
          : entity instanceof Ball
            ? 'ball'
            : 'unknown';
      result.push({
        type,
        state: entity.toState(this.config.pixelsPerMeter),
      });
    });
    return result;
  }

  /**
   * Restores entities from saved state
   */
  restoreEntitiesState(
    savedState: Array<{ type: string; state: Record<string, unknown> }>,
    newPixelsPerMeter: number,
  ): void {
    // Clear existing entities
    this.entities.forEach(({ shape }) => shape.destroy());
    this.entities.clear();

    // Restore each entity based on its type
    savedState.forEach(({ type, state }) => {
      let entity: CourtEntity;

      switch (type) {
        case 'player':
          entity = Player.fromState(state, newPixelsPerMeter);
          break;
        case 'ball':
          entity = Ball.fromState(state, newPixelsPerMeter);
          break;
        default:
          console.warn(`Unknown entity type: ${type}`);
          return;
      }

      // Add entity without triggering individual layer.draw()
      const shape = this.renderEntity(entity);
      this.entities.set(entity.id, { entity, shape });
    });

    // Draw all at once
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
    if (newStyles) {
      this.styles = newStyles;
    }

    // Clear the layer
    this.layer.destroyChildren();
    this.entities.clear();

    // Re-render court background
    this.renderCourtBackground();
    this.renderGoalAreas();
    this.renderCenterElements();

    // Restore entities with new scale
    if (savedState.length > 0) {
      this.restoreEntitiesState(savedState, newConfig.pixelsPerMeter);
    }
  }
}
