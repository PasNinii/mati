import { FilterConfig } from '../filter-config.interface';
import { FilterType } from '../filter-type.enum';

/**
 * Abstract base class for all filter types
 * Provides common functionality for serialization, deserialization, and keyboard shortcuts
 */
export abstract class BaseFilter<T = any> {
  protected _config: FilterConfig;
  protected _value: T;

  constructor(config: FilterConfig) {
    this._config = config;
    this._value = this.getDefaultValue();
  }

  get config(): FilterConfig {
    return this._config;
  }

  get value(): T {
    return this._value;
  }

  set value(val: T) {
    this._value = val;
  }

  get id(): string {
    return this._config.id;
  }

  get label(): string {
    return this._config.label;
  }

  get type(): FilterType {
    return this._config.type;
  }

  /**
   * Get the default value for this filter based on config
   */
  protected getDefaultValue(): T {
    return (this._config.defaultValue ?? this.getTypeDefaultValue()) as T;
  }

  /**
   * Get the default value based on filter type
   * Subclasses can override this to provide type-specific defaults
   */
  protected abstract getTypeDefaultValue(): any;

  /**
   * Check if the filter has a meaningful value
   * Subclasses can override for custom logic
   */
  hasValue(): boolean {
    // Non-clearable filters always have a value
    if (this._config.clearable === false) {
      return true;
    }

    // Boolean filters with a default value should always have a value
    if (
      this._config.type === 'boolean' &&
      this._config.defaultValue !== undefined
    ) {
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
    this._value = this.getDefaultValue();
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
  toJSON(): any {
    return {
      id: this.id,
      value: this._value,
    };
  }
}
