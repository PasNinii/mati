/**
 * Interface for ball positioning on the court
 */
export interface BallCoordinates {
  x: number;
  y: number;
}

/**
 * Ball class representing a handball on the tactical board
 */
export class Ball {
  id: string;
  coordinates: BallCoordinates;
  draggable: boolean;

  constructor(
    coordinates: BallCoordinates = { x: 0, y: 0 },
    draggable: boolean = true,
  ) {
    this.id = 'ball';
    this.coordinates = coordinates;
    this.draggable = draggable;
  }

  /**
   * Updates the ball's coordinates
   */
  updateCoordinates(x: number, y: number): void {
    this.coordinates = { x, y };
  }

  /**
   * Sets the ball's draggable state
   */
  setDraggable(draggable: boolean): void {
    this.draggable = draggable;
  }

  /**
   * Creates a ball at a specific position in meters
   */
  static createAtMeters(
    xMeters: number,
    yMeters: number,
    pixelsPerMeter: number,
    draggable: boolean = true,
  ): Ball {
    return new Ball(
      {
        x: xMeters * pixelsPerMeter,
        y: yMeters * pixelsPerMeter,
      },
      draggable,
    );
  }
}
