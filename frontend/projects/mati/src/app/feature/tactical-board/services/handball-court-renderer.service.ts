import Konva from 'konva';
import { CourtConfig, CourtStyles } from '../models/court-config.interface';
import { HandballZone } from '../models/handball-zone';

/**
 * Renders a complete handball court with all its elements:
 * - Court background and borders
 * - Goal areas (6m and 9m zones)
 * - Goal lines
 * - Center line and circle
 */
export class HandballCourtRenderer {
  private layer: Konva.Layer;
  private config: CourtConfig;
  private styles: CourtStyles;

  constructor(layer: Konva.Layer, config: CourtConfig, styles: CourtStyles) {
    this.layer = layer;
    this.config = config;
    this.styles = styles;
  }

  /**
   * Renders the complete handball court
   */
  render(): void {
    this.renderCourtBackground();
    this.renderGoalAreas();
    this.renderCenterElements();
    this.layer.draw();
  }

  /**
   * Renders the court background and border
   */
  private renderCourtBackground(): void {
    const width = this.config.widthM * this.config.pixelsPerMeter;
    const height = this.config.heightM * this.config.pixelsPerMeter;

    const background = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: this.styles.courtColor,
      stroke: this.styles.borderColor,
      strokeWidth: this.styles.borderWidth,
    });

    this.layer.add(background);
  }

  /**
   * Renders goal areas (6m and 9m zones) for both ends of the court
   */
  private renderGoalAreas(): void {
    const width = this.config.widthM * this.config.pixelsPerMeter;
    const height = this.config.heightM * this.config.pixelsPerMeter;
    const centerX = width / 2;

    // Top goal area (y = 0) - always render
    this.renderSingleGoalArea(centerX, 0, false);

    // Bottom goal area (y = height) - only render in full court mode
    if (!this.config.halfCourt) {
      this.renderSingleGoalArea(centerX, height, true);
    }
  }

  /**
   * Renders a single goal area (6m and 9m zones + goal line)
   * @param centerX X coordinate of the goal center
   * @param yPosition Y coordinate of the goal line
   * @param isBottom Whether this is the bottom goal area
   */
  private renderSingleGoalArea(
    centerX: number,
    yPosition: number,
    isBottom: boolean,
  ): void {
    // Create and render 6m zone (filled blue)
    const zone6m = new HandballZone(
      centerX,
      yPosition,
      6,
      this.config,
      isBottom,
    );
    const zone6mShape = zone6m.createShape(this.styles, true);
    this.layer.add(zone6mShape);

    // Create and render 9m zone (dashed line)
    const zone9m = new HandballZone(
      centerX,
      yPosition,
      9,
      this.config,
      isBottom,
    );
    const zone9mShape = zone9m.createShape(this.styles, false);
    this.layer.add(zone9mShape);

    // Render goal line
    this.renderGoalLine(centerX, yPosition);
  }

  /**
   * Renders the goal line (3m wide, centered)
   */
  private renderGoalLine(centerX: number, yPosition: number): void {
    const halfGoalPx =
      (this.config.goalWidthM / 2) * this.config.pixelsPerMeter;

    const goalLine = new Konva.Line({
      points: [
        centerX - halfGoalPx,
        yPosition,
        centerX + halfGoalPx,
        yPosition,
      ],
      stroke: this.styles.goalLineColor,
      strokeWidth: this.styles.goalLineWidth,
    });

    this.layer.add(goalLine);
  }

  /**
   * Renders center line and center circle
   */
  private renderCenterElements(): void {
    // Skip center elements in half court mode
    // In half court mode, the bottom border represents the center/medium line
    if (this.config.halfCourt) {
      return;
    }

    const width = this.config.widthM * this.config.pixelsPerMeter;
    const height = this.config.heightM * this.config.pixelsPerMeter;

    // Center line
    const centerLine = new Konva.Line({
      points: [0, height / 2, width, height / 2],
      stroke: this.styles.borderColor,
      strokeWidth: this.styles.borderWidth,
    });
    this.layer.add(centerLine);

    // Center circle (radius = 3m in handball)
    const centerCircleRadius = 3 * this.config.pixelsPerMeter;
    const centerCircle = new Konva.Circle({
      x: width / 2,
      y: height / 2,
      radius: centerCircleRadius,
      stroke: this.styles.borderColor,
      strokeWidth: this.styles.borderWidth,
      fill: 'transparent',
    });
    this.layer.add(centerCircle);
  }

  /**
   * Clears the court and re-renders with new configuration
   */
  refresh(config?: CourtConfig, styles?: CourtStyles): void {
    if (config) this.config = config;
    if (styles) this.styles = styles;

    this.layer.destroyChildren();
    this.render();
  }
}
