/**
 * Represents a point in 2D space
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Utility class for geometric calculations in handball court rendering
 */
export class GeometryUtils {
  /**
   * Generates points for a circular arc
   * @param centerX X coordinate of the arc center
   * @param centerY Y coordinate of the arc center
   * @param radius Radius of the arc
   * @param startAngle Starting angle in radians
   * @param endAngle Ending angle in radians
   * @param segments Number of segments to approximate the arc
   * @returns Array of points forming the arc
   */
  static generateArcPoints(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    segments: number,
  ): Point2D[] {
    const points: Point2D[] = [];
    const angleStep = (endAngle - startAngle) / segments;

    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push({ x, y });
    }

    return points;
  }

  /**
   * Generates points for a straight line segment
   * @param startX Starting X coordinate
   * @param startY Starting Y coordinate
   * @param endX Ending X coordinate
   * @param endY Ending Y coordinate
   * @param segments Number of segments to divide the line into
   * @returns Array of points forming the line
   */
  static generateLinePoints(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    segments: number,
  ): Point2D[] {
    const points: Point2D[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = startX + t * (endX - startX);
      const y = startY + t * (endY - startY);
      points.push({ x, y });
    }

    return points;
  }

  /**
   * Converts an array of points to an SVG path string
   * @param points Array of points
   * @param closePath Whether to close the path with 'Z' command
   * @returns SVG path data string
   */
  static pointsToSVGPath(
    points: Point2D[],
    closePath: boolean = false,
  ): string {
    if (points.length === 0) return '';

    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
    }

    if (closePath) {
      path += ' Z';
    }

    return path;
  }
}
