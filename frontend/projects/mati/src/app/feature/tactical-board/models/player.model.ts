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
    team: Team,
    role: PlayerRole,
    position: PlayerPosition,
    coordinates: EntityCoordinates,
    draggable: boolean = true,
    styles: PlayerStyles = DEFAULT_PLAYER_STYLES,
  ) {
    const id = `${team}-${role}-${position}-${Date.now()}-${Math.random()}`;
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

/**
 * Default player positions for attack formation (6 players)
 * Attack players must be OUTSIDE the 9m zone
 * Wings should be near corners (x=0 or x=max, y≈0)
 *
 * For a standard court (40m x 20m):
 * - 6m zone is approximately at y = 6m
 * - 9m zone is approximately at y = 9m
 * - Attack should be beyond 9m (around 10-13m from goal)
 *
 * Positions are defined in METERS from the goal (y=0) and from left edge (x=0).
 * This ensures consistent positioning regardless of half/full court mode.
 */
export const DEFAULT_ATTACK_POSITIONS: Record<
  AttackPosition,
  { xMeters: number; yMeters: number }
> = {
  // Wings almost at sidelines - at around 1m from goal
  [AttackPosition.LW]: { xMeters: 1, yMeters: 1 }, // Left Wing - almost at left edge
  [AttackPosition.RW]: { xMeters: 19, yMeters: 1 }, // Right Wing - almost at right edge (20m court width - 1m)

  // Backs outside 9m zone (around 11-12m from goal)
  [AttackPosition.LB]: { xMeters: 1, yMeters: 11.5 }, // Left Back - outside 9m
  [AttackPosition.CB]: { xMeters: 10, yMeters: 13.5 }, // Center Back - outside 9m (furthest)
  [AttackPosition.RB]: { xMeters: 19, yMeters: 11.5 }, // Right Back - outside 9m

  // Pivot closer to 9m line, ready to penetrate
  [AttackPosition.P]: { xMeters: 10, yMeters: 7 }, // Pivot - between 9m and backs
};

/**
 * Default player positions for defense formation (6 players)
 * Defense players must be BETWEEN 6m and 9m zones
 *
 * For a standard court (40m x 20m):
 * - 6m zone ends at y = 6m
 * - 9m zone ends at y = 9m
 * - Defense should be between these lines (6m < y < 9m)
 *
 * Using numeric positions: 1=wings, 2=backs, 3=pivot/center
 * Positions are defined in METERS from the goal (y=0) and from left edge (x=0).
 */
export const DEFAULT_DEFENSE_POSITIONS: Array<{
  position: DefensePosition;
  xMeters: number;
  yMeters: number;
}> = [
  // Wings (1) - two players, around 2.5m from goal, very wide on the sides
  { position: DefensePosition.WINGS, xMeters: 2, yMeters: 2.5 },
  { position: DefensePosition.WINGS, xMeters: 18, yMeters: 2.5 },

  // Backs (2) - two players, around 6m from goal, well spaced
  { position: DefensePosition.BACKS, xMeters: 4, yMeters: 6 },
  { position: DefensePosition.BACKS, xMeters: 16, yMeters: 6 },

  // Pivot & Center Back (3) - two players, around 7.5m from goal, well spaced apart
  { position: DefensePosition.PIVOT_CENTER, xMeters: 8, yMeters: 7.5 },
  { position: DefensePosition.PIVOT_CENTER, xMeters: 12, yMeters: 7.5 },
];
