import Konva from 'konva';
import { Entity } from './entity.model';

/**
 * Abstract class for moving entities (Player, Ball)
 * These entities are draggable and have coordinate displays
 */
export abstract class MovingEntity extends Entity {
  draggable: boolean;
  protected showCoordinates: boolean = false;

  constructor(
    id: string,
    coordinates: { x: number; y: number },
    draggable: boolean = true,
  ) {
    super(id, coordinates);
    this.draggable = draggable;
  }

  /**
   * Toggles the visibility of the coordinate display
   */
  setCoordinatesVisible(visible: boolean): void {
    this.showCoordinates = visible;
    if (this.shape instanceof Konva.Group) {
      const coordsText = this.shape.findOne('.coordinates');
      if (coordsText) {
        coordsText.visible(visible);
      }
    }
  }

  /**
   * Updates the coordinate text display with current position
   */
  updateCoordinateText(pixelsPerMeter: number): void {
    if (!this.shape) return;
    this.updateCoordinatesDisplay(pixelsPerMeter);
  }

  /**
   * Updates the coordinates display if shown
   */
  protected updateCoordinatesDisplay(pixelsPerMeter: number): void {
    if (!(this.shape instanceof Konva.Group)) return;
    const coordsText = this.shape.findOne('.coordinates') as Konva.Text;
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
      name: 'coordinates',
      text: `(${xMeters}m, ${yMeters}m)`,
      fontSize: 10,
      fill: '#000000',
      align: 'center',
      y: offsetY,
      visible: this.showCoordinates,
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
      this.updateCoordinatesDisplay(pixelsPerMeter);
    });
  }

  /**
   * Updates shape position and scale when config changes
   * For moving entities: just update position and coordinate display
   */
  override updateShape(pixelsPerMeter: number, scaleFactor?: number): void {
    if (!this.shape || !(this.shape instanceof Konva.Group)) return;
    if (!scaleFactor) return; // Moving entities require scaleFactor

    // Scale position
    this.shape.x(this.shape.x() * scaleFactor);
    this.shape.y(this.shape.y() * scaleFactor);

    // Sync internal coordinates
    this.updateCoordinates(this.shape.x(), this.shape.y());

    // Update coordinate text
    this.updateCoordinateText(pixelsPerMeter);
  }
}
