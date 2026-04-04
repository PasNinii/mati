import Konva from 'konva';
import { MovingEntity } from './moving-entity.model';
import { EntityCoordinates } from './entity.model';

/**
 * Player position types for handball
 */
export enum AttackPosition {
  RW = 'RW', // Right Wing
  RB = 'RB', // Right Back
  CB = 'CB', // Center Back
  LB = 'LB', // Left Back
  LW = 'LW', // Left Wing
  P = 'P', // Pivot
}

export enum DefensePosition {
  WINGS = '1', // Wings (1)
  BACKS = '2', // Right & Left Back (2)
  PIVOT_CENTER = '3', // Pivot & Center Back (3)
}

export type PlayerPosition = AttackPosition | DefensePosition;

/**
 * Team identifier
 */
export enum Team {
  HOME = 'home',
  AWAY = 'away',
}

/**
 * Player role type
 */
export enum PlayerRole {
  ATTACK = 'attack',
  DEFENSE = 'defense',
}

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
  homeAttackColor: '#2196F3',
  homeDefenseColor: '#1976D2',
  awayAttackColor: '#F44336',
  awayDefenseColor: '#D32F2F',
  playerRadius: 20,
  strokeWidth: 2,
  strokeColor: '#FFFFFF',
  textColor: '#FFFFFF',
  fontSize: 12,
};

/**
 * Player class representing a handball player on the tactical board
 */
export class Player extends MovingEntity {
  team: Team;
  role: PlayerRole;
  position: PlayerPosition;
  private styles: PlayerStyles;

  constructor(
    id: string,
    team: Team,
    role: PlayerRole,
    position: PlayerPosition,
    coordinates: EntityCoordinates,
    draggable: boolean = true,
    styles: PlayerStyles = DEFAULT_PLAYER_STYLES,
  ) {
    super(id, coordinates, draggable);
    this.team = team;
    this.role = role;
    this.position = position;
    this.styles = styles;
  }

  /**
   * Get the display label for the player
   */
  private getLabel(): string {
    return this.position.toString();
  }

  /**
   * Gets the appropriate color for this player based on team and role
   */
  private getColor(): string {
    if (this.team === Team.HOME) {
      return this.role === PlayerRole.ATTACK
        ? this.styles.homeAttackColor
        : this.styles.homeDefenseColor;
    } else {
      return this.role === PlayerRole.ATTACK
        ? this.styles.awayAttackColor
        : this.styles.awayDefenseColor;
    }
  }

  /**
   * Creates the Konva shape for the player
   */
  createShape(config: {
    pixelsPerMeter: number;
    showCoordinates: boolean;
  }): Konva.Group {
    const group = new Konva.Group({
      name: this.id,
      x: this.coordinates.x,
      y: this.coordinates.y,
      draggable: this.draggable,
    });

    // Create circle for player
    const circle = new Konva.Circle({
      radius: this.styles.playerRadius,
      fill: this.getColor(),
      stroke: this.styles.strokeColor,
      strokeWidth: this.styles.strokeWidth,
    });

    // Create text label
    const text = new Konva.Text({
      text: this.getLabel(),
      fontSize: this.styles.fontSize,
      fontStyle: 'bold',
      fill: this.styles.textColor,
      align: 'center',
      verticalAlign: 'middle',
    });

    // Center the text within the circle
    text.offsetX(text.width() / 2);
    text.offsetY(text.height() / 2);

    group.add(circle);
    group.add(text);

    // Always create coordinates text, but set visibility based on config
    const coordsText = this.createCoordinatesText(
      config.pixelsPerMeter,
      this.styles.playerRadius + 5,
    );
    coordsText.visible(config.showCoordinates);
    group.add(coordsText);

    // Setup drag handlers
    this.setupDragHandlers(group, config.pixelsPerMeter);

    return group;
  }
}
