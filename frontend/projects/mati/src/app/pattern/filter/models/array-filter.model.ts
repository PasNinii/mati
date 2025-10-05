import { Type } from '@angular/core';
import { BaseFilter } from './base-filter.model';
import { FilterConfig } from '../filter-config.interface';
import { MultiSelectFilterComponent } from '../../../ui/filters/multi-select-filter/multi-select-filter.component';

/**
 * Array filter for multi-select inputs
 */
export class ArrayFilter<T = unknown> extends BaseFilter<T[]> {
  public readonly component: Type<any> = MultiSelectFilterComponent;

  protected getTypeDefaultValue(): T[] {
    return [];
  }

  protected hasValueInternal(): boolean {
    const val = this.value();
    return Array.isArray(val) && val.length > 0;
  }

  serialize(): string | null {
    if (!this.hasValue()) {
      return null;
    }
    // Join array values with comma
    return this.value()
      .map((v) => String(v))
      .join(',');
  }

  deserialize(value: string): void {
    if (!value || value.trim() === '') {
      this.value.set([]);
      return;
    }
    // Split comma-separated values
    this.value.set(value.split(',').map((v) => v.trim() as T));
  }

  /**
   * Add a value to the array
   */
  add(value: T): void {
    this.value.update((arr) => {
      if (!arr.includes(value)) {
        return [...arr, value];
      }
      return arr;
    });
  }

  /**
   * Remove a value from the array
   */
  remove(value: T): void {
    this.value.update((arr) => arr.filter((v) => v !== value));
  }

  /**
   * Toggle a value in the array
   */
  toggle(value: T): void {
    this.value.update((arr) => {
      if (arr.includes(value)) {
        return arr.filter((v) => v !== value);
      } else {
        return [...arr, value];
      }
    });
  }

  /**
   * Array filters don't use keyboard shortcuts
   */
  override initShortcuts(): void {
    // No shortcuts for array filters
  }
}
