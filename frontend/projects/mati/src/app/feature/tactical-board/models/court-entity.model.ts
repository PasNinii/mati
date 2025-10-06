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
   * Serializes the entity state to a plain object for preservation
   * Positions are stored in meters for scale-independence
   * Subclasses should override to include type-specific data
   */
  abstract toState(pixelsPerMeter: number): Record<string, unknown>;

  /**
   * Creates and returns the Konva shape for this entity
   * Each subclass must implement how to render itself
   */
  abstract createShape(config: {
    pixelsPerMeter: number;
    showCoordinates: boolean;
  }): Konva.Group;

  /**
   * Sets the shape reference after creation
   * This allows the entity to manipulate its own visual representation
   */
  setShape(shape: Konva.Group): void {
    this.shape = shape;
  }

  /**
   * Gets the current shape reference
   */
  getShape(): Konva.Group | undefined {
    return this.shape;
  }

  /**
   * Toggles the visibility of the coordinate display
   * Returns true if the operation was successful
   */
  setCoordinatesVisible(visible: boolean): boolean {
    if (!this.shape) return false;

    const coordsText = this.shape.findOne('.coordinates');
    if (coordsText) {
      coordsText.visible(visible);
      return true;
    }
    return false;
  }

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
