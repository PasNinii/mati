import Konva from 'konva';
import { Entity } from '../models/entity.model';
import { Player } from '../models/player.model';
import { Ball } from '../models/ball.model';

/**
 * Entity entry in the tracking map
 */
interface EntityEntry {
  entity: Entity;
  shape: Konva.Group | Konva.Shape;
}

/**
 * Manages the lifecycle of entities on the tactical board
 * Responsibilities:
 * - Add/remove entities
 * - Track entity-shape mappings
 * - Query entities by type
 * - Clear all entities
 */
export class EntityManager {
  private entities: Map<string, EntityEntry> = new Map();

  /**
   * Adds a new entity with its rendered shape
   */
  add(entity: Entity, shape: Konva.Group | Konva.Shape): void {
    entity.setShape(shape); // Link shape to entity
    this.entities.set(entity.id, { entity, shape });
  }

  /**
   * Removes an entity by ID
   * Returns true if entity was found and removed
   */
  remove(entityId: string): boolean {
    const entry = this.entities.get(entityId);
    if (entry) {
      entry.shape.destroy();
      this.entities.delete(entityId);
      return true;
    }
    return false;
  }

  /**
   * Gets an entity by ID
   */
  get(entityId: string): Entity | undefined {
    return this.entities.get(entityId)?.entity;
  }

  /**
   * Gets the shape associated with an entity
   */
  getShape(entityId: string): Konva.Group | Konva.Shape | undefined {
    return this.entities.get(entityId)?.shape;
  }

  /**
   * Gets all entities
   */
  getAll(): Entity[] {
    return Array.from(this.entities.values()).map((entry) => entry.entity);
  }

  /**
   * Gets all entity entries (entity + shape pairs)
   */
  getAllEntries(): EntityEntry[] {
    return Array.from(this.entities.values());
  }

  /**
   * Gets all entities of a specific type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getByType<T extends Entity>(type: new (...args: any[]) => T): T[] {
    const result: T[] = [];
    this.entities.forEach(({ entity }) => {
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
   * Gets the current ball (if any)
   */
  getBall(): Ball | null {
    const balls = this.getByType(Ball);
    return balls.length > 0 ? balls[0] : null;
  }

  /**
   * Checks if a ball exists on the court
   */
  hasBall(): boolean {
    return this.getByType(Ball).length > 0;
  }

  /**
   * Checks if any entities exist
   */
  hasEntities(): boolean {
    return this.entities.size > 0;
  }

  /**
   * Gets the count of entities
   */
  count(): number {
    return this.entities.size;
  }

  /**
   * Clears all entities and destroys their shapes
   */
  clear(): void {
    this.entities.forEach(({ shape }) => shape.destroy());
    this.entities.clear();
  }
}
