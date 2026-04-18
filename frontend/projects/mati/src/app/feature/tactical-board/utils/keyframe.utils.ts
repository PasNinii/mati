import { Keyframe } from '../models/scenario.model';

export function resolvePositionAtTime(
  entityId: string,
  sortedKeyframes: Keyframe[],
  time: number,
): { x: number; y: number } | null {
  for (let i = sortedKeyframes.length - 1; i >= 0; i--) {
    const kf = sortedKeyframes[i];
    if (kf.time <= time && kf.positions[entityId]) {
      return kf.positions[entityId];
    }
  }
  return null;
}
