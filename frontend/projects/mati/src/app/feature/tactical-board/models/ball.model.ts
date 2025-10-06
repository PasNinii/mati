import Konva from 'konva';
import { CourtEntity, EntityCoordinates } from './court-entity.model';

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
export class Ball extends CourtEntity {
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

    // Add coordinates text if enabled
    if (config.showCoordinates) {
      const coordsText = this.createCoordinatesText(
        config.pixelsPerMeter,
        this.styles.ballRadius + 5,
      );
      group.add(coordsText);
    }

    // Setup drag handlers
    this.setupDragHandlers(group, config.pixelsPerMeter);

    return group;
  }

  /**
   * Perform actions on the ball (e.g., pass, shoot, etc.)
   */
  performAction(actionType: string, ...args: unknown[]): void {
    switch (actionType) {
      case 'pass':
        // Could animate a pass to another player
        console.log('Ball passed to', args[0]);
        break;
      case 'shoot':
        // Could animate a shot towards goal
        console.log('Ball shot towards goal');
        break;
      case 'highlight':
        // Could highlight the ball temporarily
        console.log('Ball highlighted');
        break;
      default:
        console.warn(`Unknown action type: ${actionType}`);
    }
  }

  /**
   * Creates a ball at a specific position in meters
   */
  static createAtMeters(
    xMeters: number,
    yMeters: number,
    pixelsPerMeter: number,
    draggable: boolean = true,
    styles?: BallStyles,
  ): Ball {
    return new Ball(
      {
        x: xMeters * pixelsPerMeter,
        y: yMeters * pixelsPerMeter,
      },
      draggable,
      styles,
    );
  }

  /**
   * Updates ball styling
   */
  setStyles(styles: Partial<BallStyles>): void {
    this.styles = { ...this.styles, ...styles };
  }

  /**
   * Serializes the ball state to a plain object
   */
  toState(pixelsPerMeter: number): Record<string, unknown> {
    const meters = this.toMeters(pixelsPerMeter);
    return {
      xMeters: meters.x,
      yMeters: meters.y,
      draggable: this.draggable,
    };
  }

  /**
   * Static factory method to create a ball from serialized state
   */
  static fromState(
    data: Record<string, unknown>,
    pixelsPerMeter: number,
  ): Ball {
    return new Ball(
      {
        x: (data['xMeters'] as number) * pixelsPerMeter,
        y: (data['yMeters'] as number) * pixelsPerMeter,
      },
      data['draggable'] as boolean,
      DEFAULT_BALL_STYLES,
    );
  }
}
