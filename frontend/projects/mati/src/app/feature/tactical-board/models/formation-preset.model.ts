import {
  AttackPosition,
  DefensePosition,
  Team,
  PlayerRole,
} from './player.model';
import { EntityDefinition } from './scenario.model';

export interface FormationPreset {
  entities: EntityDefinition[];
  positions: Record<string, { x: number; y: number }>;
}

export const DEFAULT_FORMATION: FormationPreset = {
  entities: [
    { id: 'home-attack-LW', type: 'player', team: 'home', role: 'attack', position: AttackPosition.LW },
    { id: 'home-attack-RW', type: 'player', team: 'home', role: 'attack', position: AttackPosition.RW },
    { id: 'home-attack-LB', type: 'player', team: 'home', role: 'attack', position: AttackPosition.LB },
    { id: 'home-attack-CB', type: 'player', team: 'home', role: 'attack', position: AttackPosition.CB },
    { id: 'home-attack-RB', type: 'player', team: 'home', role: 'attack', position: AttackPosition.RB },
    { id: 'home-attack-P', type: 'player', team: 'home', role: 'attack', position: AttackPosition.P },
    { id: 'away-defense-1-0', type: 'player', team: 'away', role: 'defense', position: DefensePosition.WINGS },
    { id: 'away-defense-1-1', type: 'player', team: 'away', role: 'defense', position: DefensePosition.WINGS },
    { id: 'away-defense-2-0', type: 'player', team: 'away', role: 'defense', position: DefensePosition.BACKS },
    { id: 'away-defense-2-1', type: 'player', team: 'away', role: 'defense', position: DefensePosition.BACKS },
    { id: 'away-defense-3-0', type: 'player', team: 'away', role: 'defense', position: DefensePosition.PIVOT_CENTER },
    { id: 'away-defense-3-1', type: 'player', team: 'away', role: 'defense', position: DefensePosition.PIVOT_CENTER },
    { id: 'ball', type: 'ball' },
  ],
  positions: {
    'home-attack-LW': { x: 1, y: 1 },
    'home-attack-RW': { x: 19, y: 1 },
    'home-attack-LB': { x: 1, y: 11.5 },
    'home-attack-CB': { x: 10, y: 13.5 },
    'home-attack-RB': { x: 19, y: 11.5 },
    'home-attack-P': { x: 10, y: 7 },
    'away-defense-1-0': { x: 2, y: 2.5 },
    'away-defense-1-1': { x: 18, y: 2.5 },
    'away-defense-2-0': { x: 4, y: 6 },
    'away-defense-2-1': { x: 16, y: 6 },
    'away-defense-3-0': { x: 8, y: 7.5 },
    'away-defense-3-1': { x: 12, y: 7.5 },
    'ball': { x: 10, y: 13.5 },
  },
};
