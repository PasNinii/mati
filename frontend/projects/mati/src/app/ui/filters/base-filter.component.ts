import { Directive, input, output, model, effect } from '@angular/core';

/**
 * Abstract base class for all filter UI components
 * Provides common functionality for value synchronization
 */
@Directive()
export abstract class BaseFilterComponent<T = unknown> {
  // Common inputs
  id = input.required<string>();
  label = input<string>('');
  value = input<T>(this.getDefaultValue());

  // Common output
  valueChange = output<T>();

  // Internal signal for the current value
  internalValue = model<T>(this.getDefaultValue());

  constructor() {
    // Sync value input to internalValue whenever it changes
    effect(() => {
      const newValue = this.value();
      if (!this.valuesEqual(this.internalValue(), newValue)) {
        this.internalValue.set(newValue);
      }
    });
  }

  /**
   * Get the default value for this filter type
   * Subclasses can override this
   */
  protected abstract getDefaultValue(): T;

  /**
   * Compare two values for equality
   * Override this for complex types (arrays, objects)
   */
  protected valuesEqual(a: T, b: T): boolean {
    return a === b;
  }

  /**
   * Handle value changes from the UI
   */
  onValueChange(value: T): void {
    this.internalValue.set(value);
    this.valueChange.emit(value);
  }

  /**
   * Clear the filter value
   */
  clear(): void {
    const defaultValue = this.getDefaultValue();
    this.internalValue.set(defaultValue);
    this.valueChange.emit(defaultValue);
  }
}
