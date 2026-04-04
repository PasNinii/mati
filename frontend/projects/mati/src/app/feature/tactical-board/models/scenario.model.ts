export interface EntityDefinition {
  id: string;
  type: 'player' | 'ball';
  team?: 'home' | 'away';
  role?: 'attack' | 'defense';
  position?: string;
}

export interface Keyframe {
  time: number;
  positions: Record<string, { x: number; y: number }>;
}

export interface Scenario {
  name: string;
  courtConfig: {
    widthM: number;
    heightM: number;
    fullCourt: boolean;
  };
  duration: number;
  entities: EntityDefinition[];
  keyframes: Keyframe[];
}
