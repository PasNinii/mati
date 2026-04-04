import { signal, Signal, WritableSignal, Type } from '@angular/core';
import { FilterConfig } from '../filter-config.interface';
import { BaseFilterComponent } from '../base-filter.component';

/**
 * Abstract base class for all filter types
 * Provides common functionality for serialization, deserialization, and keyboard shortcuts
 * Config and value are stored as signals for reactivity
 * Each filter specifies its UI component
 */
export abstract class BaseFilter<T = unknown> {
  // Config as a readonly signal - centralized source of truth
  public readonly config: Signal<FilterConfig>;

  // Value as a writable signal - centralized reactive state
  public readonly value: WritableSignal<T>;

  // Component to render this filter - defined by subclasses
  public readonly component: Type<BaseFilterComponent<T>> =
    BaseFilterComponent as Type<BaseFilterComponent<T>>;

  // Shortcut cleanup functions
  private shortcutCleanups: Array<() => void> = [];

  constructor(config: FilterConfig) {
    this.config = signal(config);
    this.value = signal(this.getDefaultValue());
  }

  public abstract initShortcuts(shortcutService: {
    register: (shortcut: string, handler: () => void) => () => void;
  }): void;

  /**
   * Unregister all shortcuts registered by this filter
   */
  public destroyShortcuts(): void {
    this.shortcutCleanups.forEach((cleanup) => cleanup());
    this.shortcutCleanups = [];
  }

  protected registerShortcut(
    service: {
      register: (shortcut: string, handler: () => void) => () => void;
    },
    shortcut: string,
    handler: () => void,
  ): void {
    const cleanup = service.register(shortcut, handler);
    this.shortcutCleanups.push(cleanup);
  }

  /**
   * Convenience getters for commonly accessed config properties
   */
  get id(): string {
    return this.config().id;
  }

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
}
