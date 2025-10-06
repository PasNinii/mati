import { Directive, input } from '@angular/core';
import { BaseFilter } from './models';

/**
 * Abstract base class for all filter UI components
 * Accepts a filter instance and works directly with its signals
 */
@Directive()
export abstract class BaseFilterComponent<T = unknown> {
  // Single input: the filter instance containing config and value
  filter = input.required<BaseFilter<T>>();

  /**
   * Handle value changes from the UI
   * Updates the filter's value signal directly
   */
  onValueChange(value: T): void {
    this.filter().value.set(value);
  }

  /**
   * Clear the filter value
   */
  clear(): void {
    this.filter().clear();
  }
}
