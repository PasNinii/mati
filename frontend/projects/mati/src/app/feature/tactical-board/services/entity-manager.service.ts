import Konva from 'konva';
import { Entity } from '../models/entity.model';
import { Player } from '../models/player.model';
import { Ball } from '../models/ball.model';

/**
 * Manages the lifecycle of entities on the tactical board
 * Responsibilities:
 * - Add/remove entities
 * - Track entity-shape mappings
 * - Query entities by type
 * - Clear all entities
 */
export class EntityManager {
  private entities: Map<string, Entity> = new Map();

  /**
   * Adds a new entity with its rendered shape
   */
  add(entity: Entity, shape: Konva.Group | Konva.Shape): void {
    entity.setShape(shape);
    this.entities.set(entity.id, entity);
  }

  /**
   * Removes an entity from the layer
   */
  remove(entity: Entity): void {
    if (this.entities.delete(entity.id)) {
      entity.destroy();
    }
  }

  /**
   * Gets all entities
   */
  getAll(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Gets all entities of a specific type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getByType<T extends Entity>(type: new (...args: any[]) => T): T[] {
    const result: T[] = [];
    this.entities.forEach((entity) => {
      if (entity instanceof type) {
        result.push(entity as T);
      }
    });
    return result;
  }

  /**
   * Gets all current players
   */
  getPlayers(): Player[] {
    return this.getByType(Player);
  }

  /**
   * Checks if a ball exists on the court
   */
  hasBall(): boolean {
    return this.getByType(Ball).length > 0;
  }

  /**
   * Clears all entities and destroys their shapes
   */
  clear(): void {
    this.entities.forEach((entity) => entity.destroy());
    this.entities.clear();
  }
}
