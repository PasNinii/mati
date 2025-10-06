import { CourtEntity } from '../models/court-entity.model';
import { Player } from '../models/player.model';
import { Ball } from '../models/ball.model';
import { EntityManager } from './entity-manager.service';

/**
 * Handles state persistence for entities
 * Responsibilities:
 * - Save entity states (positions in meters)
 * - Restore entities from saved state
 * - Handle scaling conversion on restore
 */
export class StatePersistence {
  constructor(private entityManager: EntityManager) {}

  /**
   * Saves the current state of all entities (positions in meters)
   * Returns an array of objects with entity type and serialized state
   */
  saveState(
    pixelsPerMeter: number,
  ): Array<{ type: string; state: Record<string, unknown> }> {
    const result: Array<{ type: string; state: Record<string, unknown> }> = [];

    this.entityManager.getAllEntries().forEach(({ entity }) => {
      const type =
        entity instanceof Player
          ? 'player'
          : entity instanceof Ball
            ? 'ball'
            : 'unknown';

      result.push({
        type,
        state: entity.toState(pixelsPerMeter),
      });
    });

    return result;
  }

  /**
   * Restores entities from saved state
   * Returns the restored entities (without rendering them)
   */
  restoreState(
    savedState: Array<{ type: string; state: Record<string, unknown> }>,
    newPixelsPerMeter: number,
  ): CourtEntity[] {
    const restoredEntities: CourtEntity[] = [];

    savedState.forEach(({ type, state }) => {
      let entity: CourtEntity;

      switch (type) {
        case 'player':
          entity = Player.fromState(state, newPixelsPerMeter);
          break;
        case 'ball':
          entity = Ball.fromState(state, newPixelsPerMeter);
          break;
        default:
          console.warn(`Unknown entity type: ${type}`);
          return;
      }

      restoredEntities.push(entity);
    });

    return restoredEntities;
  }
}
