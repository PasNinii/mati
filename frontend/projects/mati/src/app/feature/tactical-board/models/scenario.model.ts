export interface EntityDefinition {
  id: string;
  type: 'player' | 'ball';
  team?: 'home' | 'away';
  role?: 'attack' | 'defense';
  position?: string;
}

import { Annotation } from './annotation.model';

export interface Keyframe {
  time: number;
  positions: Record<string, { x: number; y: number }>;
  annotations?: Annotation[];
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
