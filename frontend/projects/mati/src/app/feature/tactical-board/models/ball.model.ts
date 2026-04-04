import Konva from 'konva';
import { MovingEntity } from './moving-entity.model';
import { EntityCoordinates } from './entity.model';

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
  ballColor: '#000000',
  ballRadius: 12,
  strokeWidth: 2,
  strokeColor: '#FFFFFF',
};

/**
 * Ball class representing a handball on the tactical board
 */
export class Ball extends MovingEntity {
  private styles: BallStyles;

  constructor(
    coordinates: EntityCoordinates = { x: 0, y: 0 },
    draggable: boolean = true,
    styles: BallStyles = DEFAULT_BALL_STYLES,
  ) {
    super('ball', coordinates, draggable);
    this.styles = styles;
  }

  /**
   * Creates the Konva shape for the ball
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

    // Create circle for ball
    const circle = new Konva.Circle({
      radius: this.styles.ballRadius,
      fill: this.styles.ballColor,
      stroke: this.styles.strokeColor,
      strokeWidth: this.styles.strokeWidth,
    });

    group.add(circle);

    // Always create coordinates text, but set visibility based on config
    const coordsText = this.createCoordinatesText(
      config.pixelsPerMeter,
      this.styles.ballRadius + 5,
    );
    coordsText.visible(config.showCoordinates);
    group.add(coordsText);

    // Setup drag handlers
    this.setupDragHandlers(group, config.pixelsPerMeter);

    return group;
  }
}
