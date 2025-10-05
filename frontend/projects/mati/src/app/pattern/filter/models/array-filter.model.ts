import { BaseFilter } from './base-filter.model';

/**
 * Array filter for multi-select inputs
 */
export class ArrayFilter<T = any> extends BaseFilter<T[]> {
  protected getTypeDefaultValue(): T[] {
    return [];
  }

  protected hasValueInternal(): boolean {
    return Array.isArray(this._value) && this._value.length > 0;
  }

  serialize(): string | null {
    if (!this.hasValue()) {
      return null;
    }
    // Join array values with comma
    return this._value.map((v) => String(v)).join(',');
  }

  deserialize(value: string): void {
    if (!value || value.trim() === '') {
      this._value = [];
      return;
    }
    // Split comma-separated values
    this._value = value.split(',').map((v) => v.trim() as T);
  }

  /**
   * Add a value to the array
   */
  add(value: T): void {
    if (!this._value.includes(value)) {
      this._value = [...this._value, value];
    }
  }

  /**
   * Remove a value from the array
   */
  remove(value: T): void {
    this._value = this._value.filter((v) => v !== value);
  }

  /**
   * Toggle a value in the array
   */
  toggle(value: T): void {
    if (this._value.includes(value)) {
      this.remove(value);
    } else {
      this.add(value);
    }
  }
}
