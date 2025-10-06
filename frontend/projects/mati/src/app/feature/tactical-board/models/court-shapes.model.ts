import Konva from 'konva';
import { StaticEntity } from './static-entity.model';
import { CourtConfig, CourtStyles } from './court-config.interface';
import { HandballZone } from './handball-zone';

/**
 * Background rectangle entity for the court
 */
export class BackgroundEntity extends StaticEntity {
  constructor(config: CourtConfig, styles: CourtStyles) {
    super('court-background', config, styles);
  }

  createShape(): Konva.Rect {
    const width = this.config.widthM * this.config.pixelsPerMeter;
    const height = this.config.heightM * this.config.pixelsPerMeter;

    const rect = new Konva.Rect({
      name: 'court-background',
      x: 0,
      y: 0,
      width,
      height,
      fill: this.styles.courtColor,
      stroke: this.styles.borderColor,
      strokeWidth: this.styles.borderWidth,
    });

    this.shape = rect;
    return rect;
  }

  override updateShape(pixelsPerMeter: number): void {
    if (!this.shape || !(this.shape instanceof Konva.Rect)) return;

    const width = this.config.widthM * pixelsPerMeter;
    const height = this.config.heightM * pixelsPerMeter;

    this.shape.width(width);
    this.shape.height(height);
  }
}

/**
 * Zone entity (6m or 9m zones) using HandballZone for geometry
 */
export class ZoneEntity extends StaticEntity {
  private centerX: number;
  private yPosition: number;
  private radiusM: number;
  private isBottomZone: boolean;
  private isSixMeterZone: boolean;

  constructor(
    centerX: number,
    yPosition: number,
    radiusM: number,
    config: CourtConfig,
    styles: CourtStyles,
    isBottomZone: boolean,
    isSixMeterZone: boolean,
  ) {
    const id = `zone-${radiusM}m-${isBottomZone ? 'bottom' : 'top'}`;
    super(id, config, styles);
    this.centerX = centerX;
    this.yPosition = yPosition;
    this.radiusM = radiusM;
    this.isBottomZone = isBottomZone;
    this.isSixMeterZone = isSixMeterZone;
  }

  createShape(): Konva.Path {
    // Use HandballZone to calculate the path
    const zone = new HandballZone(
      this.centerX,
      this.yPosition,
      this.radiusM,
      this.config,
      this.isBottomZone,
    );

    const pathData = zone.buildPath();

    const path = new Konva.Path({
      name: 'court-goal-area',
      data: pathData,
      fill: this.isSixMeterZone ? this.styles.zone6mColor : undefined,
      stroke: this.isSixMeterZone ? undefined : this.styles.zone9mColor,
      strokeWidth: this.isSixMeterZone ? undefined : this.styles.zoneLineWidth,
      dash: this.isSixMeterZone ? undefined : [16, 8],
    });

    this.shape = path;
    return path;
  }

  override updateShape(pixelsPerMeter: number): void {
    if (!this.shape || !(this.shape instanceof Konva.Path)) return;

    // Recalculate positions based on new scale
    const width = this.config.widthM * pixelsPerMeter;
    const height = this.config.heightM * pixelsPerMeter;

    this.centerX = width / 2;
    this.yPosition = this.isBottomZone ? height : 0;

    // Rebuild the path with new scale
    const zone = new HandballZone(
      this.centerX,
      this.yPosition,
      this.radiusM,
      this.config,
      this.isBottomZone,
    );

    const pathData = zone.buildPath();
    this.shape.data(pathData);
  }
}

/**
 * Line entity for goal lines, center lines, etc.
 */
export class LineEntity extends StaticEntity {
  private points: number[];
  private strokeColor: string;
  private strokeWidth: number;

  constructor(
    id: string,
    points: number[],
    config: CourtConfig,
    styles: CourtStyles,
    strokeColor: string,
    strokeWidth: number,
  ) {
    super(id, config, styles);
    this.points = points;
    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;
  }

  createShape(): Konva.Line {
    const line = new Konva.Line({
      name: this.id.includes('goal') ? 'court-goal-area' : 'court-center',
      points: this.points,
      stroke: this.strokeColor,
      strokeWidth: this.strokeWidth,
    });

    this.shape = line;
    return line;
  }

  override updateShape(pixelsPerMeter: number, scaleFactor?: number): void {
    if (!this.shape || !(this.shape instanceof Konva.Line)) return;
    if (!scaleFactor) return; // LineEntity requires scaleFactor

    // Scale all points
    const scaledPoints = this.points.map((p) => p * scaleFactor);
    this.shape.points(scaledPoints);
    this.points = scaledPoints;
  }
}

/**
 * Circle entity for center circle
 */
export class CircleEntity extends StaticEntity {
  private centerX: number;
  private centerY: number;
  private radiusM: number;

  constructor(
    id: string,
    centerX: number,
    centerY: number,
    radiusM: number,
    config: CourtConfig,
    styles: CourtStyles,
  ) {
    super(id, config, styles);
    this.centerX = centerX;
    this.centerY = centerY;
    this.radiusM = radiusM;
  }

  createShape(): Konva.Circle {
    const radius = this.radiusM * this.config.pixelsPerMeter;

    const circle = new Konva.Circle({
      name: 'court-center',
      x: this.centerX,
      y: this.centerY,
      radius,
      stroke: this.styles.borderColor,
      strokeWidth: this.styles.borderWidth,
      fill: 'transparent',
    });

    this.shape = circle;
    return circle;
  }

  override updateShape(pixelsPerMeter: number): void {
    if (!this.shape || !(this.shape instanceof Konva.Circle)) return;

    // Recalculate center positions
    const width = this.config.widthM * pixelsPerMeter;
    const height = this.config.heightM * pixelsPerMeter;

    this.centerX = width / 2;
    this.centerY = height / 2;

    const radius = this.radiusM * pixelsPerMeter;

    this.shape.x(this.centerX);
    this.shape.y(this.centerY);
    this.shape.radius(radius);
  }
}
