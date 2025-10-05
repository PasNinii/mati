/**
 * Configuration for the handball court dimensions and rendering
 */
export interface CourtConfig {
  /** Width of the court in meters */
  widthM: number;

  /** Height/length of the court in meters */
  heightM: number;

  /** Pixels per meter scale factor */
  pixelsPerMeter: number;

  /** Width of the goal in meters */
  goalWidthM: number;
}

/**
 * Visual styling configuration for court elements
 */
export interface CourtStyles {
  /** Background color of the court */
  courtColor: string;

  /** Border color of the court */
  borderColor: string;

  /** Border width in pixels */
  borderWidth: number;

  /** Color for 6m zone fill */
  zone6mColor: string;

  /** Color for 9m zone stroke */
  zone9mColor: string;

  /** Line width for zones */
  zoneLineWidth: number;

  /** Goal line color */
  goalLineColor: string;

  /** Goal line width */
  goalLineWidth: number;
}

/**
 * Default court configuration values
 */
export const DEFAULT_COURT_CONFIG: CourtConfig = {
  widthM: 20,
  heightM: 40,
  pixelsPerMeter: 20,
  goalWidthM: 3,
};

/**
 * Default styling configuration
 */
export const DEFAULT_COURT_STYLES: CourtStyles = {
  courtColor: '#FFA500',
  borderColor: '#000000',
  borderWidth: 3,
  zone6mColor: '#4169E1',
  zone9mColor: '#000000',
  zoneLineWidth: 3,
  goalLineColor: '#000000',
  goalLineWidth: 4,
};
