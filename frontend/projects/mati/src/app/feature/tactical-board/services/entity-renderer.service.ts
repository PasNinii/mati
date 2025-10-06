import Konva from 'konva';
import { CourtEntity } from '../models/court-entity.model';
import { EntityManager } from './entity-manager.service';

/**
 * Renders entities (players, ball) on the tactical board
 * Responsibilities:
 * - Render individual entities
 * - Toggle coordinate display
 * - Re-render entities on display changes
 */
export class EntityRenderer {
  private showCoordinates: boolean = false;

  constructor(
    private layer: Konva.Layer,
    private entityManager: EntityManager,
    private pixelsPerMeter: number,
  ) {}

  /**
   * Updates the pixels per meter scaling
   */
  setPixelsPerMeter(pixelsPerMeter: number): void {
    this.pixelsPerMeter = pixelsPerMeter;
  }

  /**
   * Sets whether to show entity coordinates
   * Efficiently toggles visibility without recreating shapes
   * Returns true if any entities were updated
   */
  setShowCoordinates(show: boolean): boolean {
    if (this.showCoordinates === show) {
      return false; // No change needed
    }

    this.showCoordinates = show;

    // Delegate to entities to toggle their own coordinate visibility
    let changed = false;
    this.entityManager.getAll().forEach((entity) => {
      if (entity.setCoordinatesVisible(show)) {
        changed = true;
      }
    });

    return changed;
  }

  /**
   * Renders a single entity using polymorphic createShape method
   * Returns the created shape
   * Note: Does NOT add to layer or trigger draw - caller's responsibility
   */
  renderEntity(entity: CourtEntity): Konva.Group {
    const shape = entity.createShape({
      pixelsPerMeter: this.pixelsPerMeter,
      showCoordinates: this.showCoordinates,
    });

    this.layer.add(shape);
    return shape;
  }

  /**
   * Renders all entities currently in the entity manager
   * Note: Does NOT trigger layer draw - caller's responsibility for batching
   */
  renderAll(): void {
    this.entityManager.getAllEntries().forEach(({ entity }) => {
      this.renderEntity(entity);
    });
  }

  /**
   * Adds and renders a new entity
   * Note: Does NOT trigger layer draw - caller's responsibility for batching
   */
  addAndRender(entity: CourtEntity): void {
    const shape = this.renderEntity(entity);
    this.entityManager.add(entity, shape);
  }

  /**
   * Gets current coordinate display state
   */
  getShowCoordinates(): boolean {
    return this.showCoordinates;
  }
}
