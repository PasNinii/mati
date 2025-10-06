import { Entity } from './entity.model';
import { CourtConfig, CourtStyles } from './court-config.interface';

/**
 * Abstract class for static court elements (background, zones, lines, circles)
 * These entities don't move and scale their entire shape geometry
 */
export abstract class StaticEntity extends Entity {
  protected config: CourtConfig;
  protected styles: CourtStyles;

  constructor(
    id: string,
    config: CourtConfig,
    styles: CourtStyles,
    coordinates: { x: number; y: number } = { x: 0, y: 0 },
  ) {
    super(id, coordinates);
    this.config = config;
    this.styles = styles;
  }

  /**
   * Updates configuration (used during reinitialize)
   */
  setConfig(config: CourtConfig): void {
    this.config = config;
  }

  /**
   * Updates styles (used during reinitialize)
   */
  setStyles(styles: CourtStyles): void {
    this.styles = styles;
  }

  /**
   * For static entities, updateShape must rebuild the shape's geometry
   * based on the new pixelsPerMeter (e.g., recalculate zone paths, line positions)
   */
  abstract override updateShape(pixelsPerMeter: number, scaleFactor: number): void;
}
