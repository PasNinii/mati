/**
 * Player position types for handball
 */
export enum AttackPosition {
  RW = 'RW', // Right Wing
  RB = 'RB', // Right Back
  CB = 'CB', // Center Back
  LB = 'LB', // Left Back
  LW = 'LW', // Left Wing
  P = 'P',   // Pivot
}

export enum DefensePosition {
  WINGS = '1',        // Wings (1)
  BACKS = '2',        // Right & Left Back (2)
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
 * Interface for player positioning on the court
 */
export interface PlayerCoordinates {
  x: number;
  y: number;
}

/**
 * Player class representing a handball player on the tactical board
 */
export class Player {
  id: string;
  team: Team;
  role: PlayerRole;
  position: PlayerPosition;
  coordinates: PlayerCoordinates;
  draggable: boolean;

  constructor(
    team: Team,
    role: PlayerRole,
    position: PlayerPosition,
    coordinates: PlayerCoordinates,
    draggable: boolean = true,
  ) {
    this.id = `${team}-${role}-${position}-${Date.now()}-${Math.random()}`;
    this.team = team;
    this.role = role;
    this.position = position;
    this.coordinates = coordinates;
    this.draggable = draggable;
  }

  /**
   * Get the display label for the player
   */
  getLabel(): string {
    return this.position.toString();
  }

  /**
   * Update player coordinates
   */
  updateCoordinates(x: number, y: number): void {
    this.coordinates = { x, y };
  }

  /**
   * Clone the player with new coordinates
   */
  clone(newCoordinates?: PlayerCoordinates): Player {
    return new Player(
      this.team,
      this.role,
      this.position,
      newCoordinates || { ...this.coordinates },
      this.draggable,
    );
  }
}

/**
 * Default player positions for attack formation (6 players)
 * Positions are in percentage of court dimensions for scaling
 */
export const DEFAULT_ATTACK_POSITIONS: Record<
  AttackPosition,
  { xPercent: number; yPercent: number }
> = {
  [AttackPosition.LW]: { xPercent: 0.1, yPercent: 0.25 }, // Left Wing
  [AttackPosition.LB]: { xPercent: 0.25, yPercent: 0.35 }, // Left Back
  [AttackPosition.CB]: { xPercent: 0.5, yPercent: 0.38 }, // Center Back
  [AttackPosition.RB]: { xPercent: 0.75, yPercent: 0.35 }, // Right Back
  [AttackPosition.RW]: { xPercent: 0.9, yPercent: 0.25 }, // Right Wing
  [AttackPosition.P]: { xPercent: 0.5, yPercent: 0.18 }, // Pivot
};

/**
 * Default player positions for defense formation (6 players)
 * Using numeric positions: 1=wings, 2=backs, 3=pivot/center
 */
export const DEFAULT_DEFENSE_POSITIONS: Array<{
  position: DefensePosition;
  xPercent: number;
  yPercent: number;
}> = [
  // Wings (1) - two players
  { position: DefensePosition.WINGS, xPercent: 0.15, yPercent: 0.22 },
  { position: DefensePosition.WINGS, xPercent: 0.85, yPercent: 0.22 },
  
  // Backs (2) - two players
  { position: DefensePosition.BACKS, xPercent: 0.3, yPercent: 0.3 },
  { position: DefensePosition.BACKS, xPercent: 0.7, yPercent: 0.3 },
  
  // Pivot & Center Back (3) - two players
  { position: DefensePosition.PIVOT_CENTER, xPercent: 0.4, yPercent: 0.15 },
  { position: DefensePosition.PIVOT_CENTER, xPercent: 0.6, yPercent: 0.15 },
];
