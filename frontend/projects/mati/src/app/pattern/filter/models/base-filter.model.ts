import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { FilterConfig } from '../filter-config.interface';
import { FilterType } from '../filter-type.enum';

/**
 * Abstract base class for all filter types
 * Provides common functionality for serialization, deserialization, and keyboard shortcuts
 * Config and value are stored as signals for reactivity
 */
export abstract class BaseFilter<T = unknown> {
  // Config as a readonly signal - centralized source of truth
  public readonly config: Signal<FilterConfig>;

  // Value as a writable signal - centralized reactive state
  public readonly value: WritableSignal<T>;

  private shortcutCleanup?: () => void;

  constructor(config: FilterConfig) {
    this.config = signal(config);
    this.value = signal(this.getDefaultValue());
  }

  /**
   * Initialize keyboard shortcuts for this filter
   * Subclasses must implement this to register their shortcuts
   */
  abstract initShortcuts(
    shortcutService: {
      register: (shortcut: string, handler: () => void) => () => void;
    },
    onUpdate: () => void,
  ): void;

  /**
   * Helper to register a shortcut and store cleanup
   */
  protected registerShortcut(
    service: {
      register: (shortcut: string, handler: () => void) => () => void;
    },
    shortcut: string,
    handler: () => void,
  ): void {
    const cleanup = service.register(shortcut, handler);

    // Chain cleanups if multiple shortcuts
    const previousCleanup = this.shortcutCleanup;
    this.shortcutCleanup = () => {
      cleanup();
      previousCleanup?.();
    };
  }

  /**
   * Cleanup shortcuts when filter is destroyed
   */
  destroy(): void {
    this.shortcutCleanup?.();
  }

  /**
   * Convenience getters for commonly accessed config properties
   */
  get id(): string {
    return this.config().id;
  }

  get label(): string {
    return this.config().label;
  }

  get type(): FilterType {
    return this.config().type;
  }

  /**
   * Get the default value for this filter based on config
   */
  protected getDefaultValue(): T {
    const cfg = this.config();
    return (cfg.defaultValue ?? this.getTypeDefaultValue()) as T;
  }

  /**
   * Get the default value based on filter type
   * Subclasses must override this to provide type-specific defaults
   */
  protected abstract getTypeDefaultValue(): unknown;

  /**
   * Check if the filter has a meaningful value
   * Subclasses can override for custom logic
   */
  hasValue(): boolean {
    const cfg = this.config();

    // Non-clearable filters always have a value
    if (cfg.clearable === false) {
      return true;
    }

    // Boolean filters with a default value should always have a value
    if (cfg.type === 'boolean' && cfg.defaultValue !== undefined) {
      return true;
    }

    // Delegate to subclass for type-specific logic
    return this.hasValueInternal();
  }

  /**
   * Internal method for type-specific value checking
   * Subclasses must implement this instead of hasValue()
   */
  protected abstract hasValueInternal(): boolean;

  /**
   * Clear/reset the filter to its default value
   */
  clear(): void {
    this.value.set(this.getDefaultValue());
  }

  /**
   * Serialize the filter value to a string for URL parameters
   * @returns string representation of the value, or null if no value
   */
  abstract serialize(): string | null;

  /**
   * Deserialize a string value from URL parameters
   * @param value - The string value to deserialize
   */
  abstract deserialize(value: string): void;

  /**
   * Convert filter to JSON representation
   */
  toJSON(): { id: string; value: T } {
    return {
      id: this.id,
      value: this.value(),
    };
  }
}
