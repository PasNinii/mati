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
} from '../models/player.model';
import { Ball } from '../models/ball.model';

/**
 * Player styling configuration
 */
export interface PlayerStyles {
  homeAttackColor: string;
  homeDefenseColor: string;
  awayAttackColor: string;
  awayDefenseColor: string;
  playerRadius: number;
  strokeWidth: number;
  strokeColor: string;
  textColor: string;
  fontSize: number;
}

export const DEFAULT_PLAYER_STYLES: PlayerStyles = {
  homeAttackColor: '#2196F3', // Blue for home attack
  homeDefenseColor: '#1976D2', // Darker blue for home defense
  awayAttackColor: '#F44336', // Red for away attack
  awayDefenseColor: '#D32F2F', // Darker red for away defense
  playerRadius: 20,
  strokeWidth: 2,
  strokeColor: '#FFFFFF',
  textColor: '#FFFFFF',
  fontSize: 12,
};

/**
 * Ball styling configuration
 */
export interface BallStyles {
  ballColor: string;
  ballRadius: number;
  strokeWidth: number;
  strokeColor: string;
}

export const DEFAULT_BALL_STYLES: BallStyles = {
  ballColor: '#000000', // Black for the ball
  ballRadius: 12,
  strokeWidth: 2,
  strokeColor: '#FFFFFF',
};

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
  private playerStyles: PlayerStyles;
  private ballStyles: BallStyles;
  private players: Player[] = [];
  private playerShapes: Map<string, Konva.Group> = new Map();
  private ball: Ball | null = null;
  private ballShape: Konva.Group | null = null;
  private showCoordinates: boolean = false;

  constructor(
    layer: Konva.Layer,
    config: CourtConfig,
    styles: CourtStyles,
    playerStyles: PlayerStyles = DEFAULT_PLAYER_STYLES,
    ballStyles: BallStyles = DEFAULT_BALL_STYLES,
  ) {
    this.layer = layer;
    this.config = config;
    this.styles = styles;
    this.playerStyles = playerStyles;
    this.ballStyles = ballStyles;
  }

  /**
   * Renders the complete handball court
   */
  render(): void {
    this.renderCourtBackground();
    this.renderGoalAreas();
    this.renderCenterElements();
    this.renderPlayers();
    this.renderBall();
    this.layer.draw();
  }

  /**
   * Initialize default players (6 players per team in attack and defense)
   * Players are always positioned in the upper part of the court (from y=0)
   * regardless of half or full court mode.
   */
  initializeDefaultPlayers(): void {
    this.players = [];

    const pixelsPerMeter = this.config.pixelsPerMeter;

    // Add home team attack players (positioned in upper part using meters from goal)
    Object.entries(DEFAULT_ATTACK_POSITIONS).forEach(([position, coords]) => {
      const player = new Player(
        Team.HOME,
        PlayerRole.ATTACK,
        position as AttackPosition,
        {
          x: coords.xMeters * pixelsPerMeter, // Convert meters to pixels from left (x=0)
          y: coords.yMeters * pixelsPerMeter, // Convert meters to pixels from top (y=0)
        },
      );
      this.players.push(player);
    });

    // Add away team defense players (positioned in upper part using meters from goal)
    DEFAULT_DEFENSE_POSITIONS.forEach((posData) => {
      const player = new Player(
        Team.AWAY,
        PlayerRole.DEFENSE,
        posData.position,
        {
          x: posData.xMeters * pixelsPerMeter, // Convert meters to pixels from left (x=0)
          y: posData.yMeters * pixelsPerMeter, // Convert meters to pixels from top (y=0)
        },
      );
      this.players.push(player);
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
   * Renders all players on the court
   */
  private renderPlayers(): void {
    this.players.forEach((player) => {
      this.renderPlayer(player);
    });
  }

  /**
   * Renders a single player with circle and label
   */
  private renderPlayer(player: Player): void {
    const group = new Konva.Group({
      x: player.coordinates.x,
      y: player.coordinates.y,
      draggable: player.draggable,
    });

    // Determine player color based on team and role
    const fillColor = this.getPlayerColor(player);

    // Create circle for player
    const circle = new Konva.Circle({
      radius: this.playerStyles.playerRadius,
      fill: fillColor,
      stroke: this.playerStyles.strokeColor,
      strokeWidth: this.playerStyles.strokeWidth,
    });

    // Create text label
    const text = new Konva.Text({
      text: player.getLabel(),
      fontSize: this.playerStyles.fontSize,
      fontStyle: 'bold',
      fill: this.playerStyles.textColor,
      align: 'center',
      verticalAlign: 'middle',
    });

    // Center the text within the circle
    text.offsetX(text.width() / 2);
    text.offsetY(text.height() / 2);

    group.add(circle);
    group.add(text);

    // Add coordinates text if enabled
    if (this.showCoordinates) {
      const xMeters = (
        player.coordinates.x / this.config.pixelsPerMeter
      ).toFixed(1);
      const yMeters = (
        player.coordinates.y / this.config.pixelsPerMeter
      ).toFixed(1);
      const coordsText = new Konva.Text({
        name: 'coords-text',
        text: `(${xMeters}m, ${yMeters}m)`,
        fontSize: 10,
        fill: '#000000',
        align: 'center',
        y: this.playerStyles.playerRadius + 5,
      });
      coordsText.offsetX(coordsText.width() / 2);
      group.add(coordsText);
    }

    // Handle drag events to update player coordinates
    group.on('dragmove', () => {
      player.updateCoordinates(group.x(), group.y());
      // Update coordinates display if enabled
      if (this.showCoordinates) {
        const coordsText = group.findOne('.coords-text') as Konva.Text;
        if (coordsText) {
          const xMeters = (
            player.coordinates.x / this.config.pixelsPerMeter
          ).toFixed(1);
          const yMeters = (
            player.coordinates.y / this.config.pixelsPerMeter
          ).toFixed(1);
          coordsText.text(`(${xMeters}m, ${yMeters}m)`);
          coordsText.offsetX(coordsText.width() / 2);
        }
      }
    });

    this.playerShapes.set(player.id, group);
    this.layer.add(group);
  }

  /**
   * Gets the appropriate color for a player based on team and role
   */
  private getPlayerColor(player: Player): string {
    if (player.team === Team.HOME) {
      return player.role === PlayerRole.ATTACK
        ? this.playerStyles.homeAttackColor
        : this.playerStyles.homeDefenseColor;
    } else {
      return player.role === PlayerRole.ATTACK
        ? this.playerStyles.awayAttackColor
        : this.playerStyles.awayDefenseColor;
    }
  }

  /**
   * Adds a new player to the court
   */
  addPlayer(player: Player): void {
    this.players.push(player);
    this.renderPlayer(player);
    this.layer.draw();
  }

  /**
   * Removes a player from the court
   */
  removePlayer(playerId: string): void {
    const playerIndex = this.players.findIndex((p) => p.id === playerId);
    if (playerIndex !== -1) {
      this.players.splice(playerIndex, 1);
      const shape = this.playerShapes.get(playerId);
      if (shape) {
        shape.destroy();
        this.playerShapes.delete(playerId);
        this.layer.draw();
      }
    }
  }

  /**
   * Gets all current players
   */
  getPlayers(): Player[] {
    return [...this.players];
  }

  /**
   * Clears all players from the court
   */
  clearPlayers(): void {
    this.players = [];
    this.playerShapes.forEach((shape) => shape.destroy());
    this.playerShapes.clear();
    this.layer.draw();
  }

  /**
   * Sets whether to show player coordinates
   */
  setShowCoordinates(show: boolean): void {
    this.showCoordinates = show;
    // Re-render players to update coordinate display
    this.playerShapes.forEach((shape) => shape.destroy());
    this.playerShapes.clear();
    this.renderPlayers();
    this.layer.draw();
  }

  /**
   * Clears the court and re-renders with new configuration
   */
  refresh(config?: CourtConfig, styles?: CourtStyles): void {
    if (config) this.config = config;
    if (styles) this.styles = styles;

    this.layer.destroyChildren();
    this.playerShapes.clear();
    this.ballShape = null;
    this.render();
  }

  /**
   * Renders the ball if it exists
   */
  private renderBall(): void {
    if (this.ball) {
      this.createBallShape(this.ball);
    }
  }

  /**
   * Creates and renders the ball shape
   */
  private createBallShape(ball: Ball): void {
    const group = new Konva.Group({
      x: ball.coordinates.x,
      y: ball.coordinates.y,
      draggable: ball.draggable,
    });

    // Create circle for ball
    const circle = new Konva.Circle({
      radius: this.ballStyles.ballRadius,
      fill: this.ballStyles.ballColor,
      stroke: this.ballStyles.strokeColor,
      strokeWidth: this.ballStyles.strokeWidth,
    });

    group.add(circle);

    // Add coordinates text if enabled
    if (this.showCoordinates) {
      const xMeters = (ball.coordinates.x / this.config.pixelsPerMeter).toFixed(
        1,
      );
      const yMeters = (ball.coordinates.y / this.config.pixelsPerMeter).toFixed(
        1,
      );
      const coordsText = new Konva.Text({
        name: 'coords-text',
        text: `(${xMeters}m, ${yMeters}m)`,
        fontSize: 10,
        fill: '#000000',
        align: 'center',
        y: this.ballStyles.ballRadius + 5,
      });
      coordsText.offsetX(coordsText.width() / 2);
      group.add(coordsText);
    }

    // Handle drag events to update ball coordinates
    group.on('dragmove', () => {
      ball.updateCoordinates(group.x(), group.y());
      // Update coordinates display if enabled
      if (this.showCoordinates) {
        const coordsText = group.findOne('.coords-text') as Konva.Text;
        if (coordsText) {
          const xMeters = (
            ball.coordinates.x / this.config.pixelsPerMeter
          ).toFixed(1);
          const yMeters = (
            ball.coordinates.y / this.config.pixelsPerMeter
          ).toFixed(1);
          coordsText.text(`(${xMeters}m, ${yMeters}m)`);
          coordsText.offsetX(coordsText.width() / 2);
        }
      }
    });

    this.ballShape = group;
    this.layer.add(group);
  }

  /**
   * Adds the ball to the court at a specific position
   */
  addBall(x?: number, y?: number): void {
    // Default position: center of the court
    const defaultX = (this.config.widthM * this.config.pixelsPerMeter) / 2;
    const defaultY = (this.config.heightM * this.config.pixelsPerMeter) / 2;

    this.ball = new Ball({ x: x ?? defaultX, y: y ?? defaultY }, true);

    if (this.ballShape) {
      this.ballShape.destroy();
    }

    this.createBallShape(this.ball);
    this.layer.draw();
  }

  /**
   * Removes the ball from the court
   */
  removeBall(): void {
    this.ball = null;
    if (this.ballShape) {
      this.ballShape.destroy();
      this.ballShape = null;
      this.layer.draw();
    }
  }

  /**
   * Gets the current ball
   */
  getBall(): Ball | null {
    return this.ball;
  }

  /**
   * Checks if the ball is currently on the court
   */
  hasBall(): boolean {
    return this.ball !== null;
  }
}
