import Konva from 'konva';

/**
 * Interface for entity coordinates on the court
 */
export interface EntityCoordinates {
  x: number;
  y: number;
}

/**
 * Abstract base class for all entities that can be placed on the tactical board
 * (players, ball, etc.)
 */
export abstract class CourtEntity {
  id: string;
  coordinates: EntityCoordinates;
  draggable: boolean;
  protected shape?: Konva.Group;

  constructor(
    id: string,
    coordinates: EntityCoordinates,
    draggable: boolean = true,
  ) {
    this.id = id;
    this.coordinates = coordinates;
    this.draggable = draggable;
  }

  /**
   * Updates the entity's coordinates
   */
  updateCoordinates(x: number, y: number): void {
    this.coordinates = { x, y };
  }

  /**
   * Sets the entity's draggable state
   */
  setDraggable(draggable: boolean): void {
    this.draggable = draggable;
  }

  /**
   * Creates and returns the Konva shape for this entity
   * Each subclass must implement how to render itself
   */
  abstract createShape(config: {
    pixelsPerMeter: number;
    showCoordinates: boolean;
  }): Konva.Group;

  /**
   * Updates the coordinates display if shown
   */
  protected updateCoordinatesDisplay(
    group: Konva.Group,
    pixelsPerMeter: number,
  ): void {
    const coordsText = group.findOne('.coords-text') as Konva.Text;
    if (coordsText) {
      const xMeters = (this.coordinates.x / pixelsPerMeter).toFixed(1);
      const yMeters = (this.coordinates.y / pixelsPerMeter).toFixed(1);
      coordsText.text(`(${xMeters}m, ${yMeters}m)`);
      coordsText.offsetX(coordsText.width() / 2);
    }
  }

  /**
   * Creates a coordinates text element
   */
  protected createCoordinatesText(
    pixelsPerMeter: number,
    offsetY: number,
  ): Konva.Text {
    const xMeters = (this.coordinates.x / pixelsPerMeter).toFixed(1);
    const yMeters = (this.coordinates.y / pixelsPerMeter).toFixed(1);
    const coordsText = new Konva.Text({
      name: 'coords-text',
      text: `(${xMeters}m, ${yMeters}m)`,
      fontSize: 10,
      fill: '#000000',
      align: 'center',
      y: offsetY,
    });
    coordsText.offsetX(coordsText.width() / 2);
    return coordsText;
  }

  /**
   * Sets up drag event handlers for the shape
   */
  protected setupDragHandlers(
    group: Konva.Group,
    pixelsPerMeter: number,
  ): void {
    group.on('dragmove', () => {
      this.updateCoordinates(group.x(), group.y());
      this.updateCoordinatesDisplay(group, pixelsPerMeter);
      this.onDrag?.(this.coordinates);
    });
  }

  /**
   * Optional callback when entity is dragged
   * Subclasses can override to add custom behavior
   */
  protected onDrag?(coordinates: EntityCoordinates): void;

  /**
   * Optional callback for custom actions
   * Subclasses can implement this to handle interactions
   */
  abstract performAction?(actionType: string, ...args: unknown[]): void;
}
