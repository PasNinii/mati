import { CourtConfig } from '../models/court-config.interface';
import { GeometryUtils, Point2D } from '../utils/geometry.utils';

/**
 * Represents a handball zone (6m or 9m) with proper geometric construction.
 *
 * Algorithm:
 * The zone boundary is the locus of points at distance R from the nearest element
 * (goal posts or goal line). The zone consists of:
 * 1. Left quarter-circle around the left goal post
 * 2. Straight line parallel to the goal line at distance R
 * 3. Right quarter-circle around the right goal post
 *
 * The geometry ensures that each point on the boundary is exactly R meters
 * from the nearest post or goal line.
 */
export class HandballZone {
  private readonly centerX: number;
  private readonly yPosition: number;
  private readonly radiusM: number;
  private readonly config: CourtConfig;
  private readonly isBottomZone: boolean;
  private readonly numSegments = 100;

  constructor(
    centerX: number,
    yPosition: number,
    radiusM: number,
    config: CourtConfig,
    isBottomZone: boolean,
  ) {
    this.centerX = centerX;
    this.yPosition = yPosition;
    this.radiusM = radiusM;
    this.config = config;
    this.isBottomZone = isBottomZone;
  }

  /**
   * Builds the complete zone path
   * @returns SVG path data string representing the zone boundary
   */
  buildPath(): string {
    const points = this.generateZonePoints();
    return GeometryUtils.pointsToSVGPath(points, false);
  }

  /**
   * Generates all points that define the zone boundary
   */
  private generateZonePoints(): Point2D[] {
    const R = this.radiusM * this.config.pixelsPerMeter;
    const halfGoal = (this.config.goalWidthM / 2) * this.config.pixelsPerMeter;

    const leftPostX = this.centerX - halfGoal;
    const rightPostX = this.centerX + halfGoal;

    const points: Point2D[] = [];

    points.push(...this.generateLeftArc(leftPostX, R));
    points.push(...this.generateRightArc(rightPostX, R));

    return points;
  }

  /**
   * Generates points for the left quarter circle around the left post
   */
  private generateLeftArc(leftPostX: number, R: number): Point2D[] {
    const points: Point2D[] = [];
    const segmentsPerArc = this.numSegments / 4;

    for (let i = 0; i <= segmentsPerArc; i++) {
      const t = i / segmentsPerArc;
      // Use angles from PI (left) to PI/2 (upward)
      const angle = Math.PI - t * (Math.PI / 2);
      const x = leftPostX + R * Math.cos(angle);
      const offsetY = R * Math.sin(angle);

      // For top zone: add offset (go downward)
      // For bottom zone: subtract offset (go upward)
      const y = this.isBottomZone
        ? this.yPosition - offsetY
        : this.yPosition + offsetY;

      if (x < 0 || y < 0) continue;
      points.push({ x, y });
    }

    return points;
  }

  /**
   * Generates points for the right quarter circle around the right post
   */
  private generateRightArc(rightPostX: number, R: number): Point2D[] {
    const points: Point2D[] = [];
    const segmentsPerArc = this.numSegments / 4;

    for (let i = 1; i <= segmentsPerArc; i++) {
      const t = i / segmentsPerArc;
      // Use angles from PI/2 (upward) to 0 (right)
      const angle = Math.PI / 2 - t * (Math.PI / 2);
      const x = rightPostX + R * Math.cos(angle);
      const offsetY = R * Math.sin(angle);

      // For top zone: add offset (stay downward)
      // For bottom zone: subtract offset (stay upward)
      const y = this.isBottomZone
        ? this.yPosition - offsetY
        : this.yPosition + offsetY;

      if (x < 0 || y < 0) continue;
      points.push({ x, y });
    }

    return points;
  }
}
