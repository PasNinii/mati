import Konva from 'konva';

/**
 * Interface for entity coordinates on the court
 */
export interface EntityCoordinates {
  x: number;
  y: number;
}

/**
 * Abstract base class for all entities on the tactical board
 * (players, ball, zones, lines, circles, background, etc.)
 *
 * Unified design: All entities manage their own Konva shapes and
 * update them using consistent toMeters/fromMeters scaling
 */
export abstract class Entity {
  id: string;
  coordinates: EntityCoordinates;
  protected shape?: Konva.Group | Konva.Shape;

  constructor(id: string, coordinates: EntityCoordinates = { x: 0, y: 0 }) {
    this.id = id;
    this.coordinates = coordinates;
  }

  /**
   * Updates the entity's coordinates
   */
  updateCoordinates(x: number, y: number): void {
    this.coordinates = { x, y };
  }

  /**
   * Converts pixel coordinates to meters
   */
  toMeters(pixelsPerMeter: number): EntityCoordinates {
    return {
      x: this.coordinates.x / pixelsPerMeter,
      y: this.coordinates.y / pixelsPerMeter,
    };
  }

  /**
   * Converts meter coordinates to pixels and updates entity position
   */
  fromMeters(meters: EntityCoordinates, pixelsPerMeter: number): void {
    this.coordinates = {
      x: meters.x * pixelsPerMeter,
      y: meters.y * pixelsPerMeter,
    };
  }

  /**
   * Creates and returns the Konva shape for this entity
   * Each subclass must implement how to render itself
   */
  abstract createShape(config: {
    pixelsPerMeter: number;
    [key: string]: unknown;
  }): Konva.Group | Konva.Shape;

  /**
   * Updates the shape's position/scale based on new pixelsPerMeter
   * Called during reinitialize - no shape destruction, just updates!
   */
  abstract updateShape(pixelsPerMeter: number, scaleFactor: number): void;

  /**
   * Sets the shape reference after creation
   */
  setShape(shape: Konva.Group | Konva.Shape): void {
    this.shape = shape;
  }

  /**
   * Gets the current shape reference
   */
  getShape(): Konva.Group | Konva.Shape | undefined {
    return this.shape;
  }
}
