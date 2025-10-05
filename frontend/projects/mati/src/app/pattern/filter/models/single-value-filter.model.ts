import { BaseFilter } from './base-filter.model';

/**
 * Single value filter for text, number, or select inputs
 */
export class SingleValueFilter<
  T extends string | number = string | number,
> extends BaseFilter<T | null> {
  protected getTypeDefaultValue(): T | null {
    return null;
  }

  protected hasValueInternal(): boolean {
    if (this._value === null || this._value === undefined) {
      return false;
    }

    if (typeof this._value === 'string') {
      return this._value.trim().length > 0;
    }

    // For numbers, including 0 is a valid value
    return true;
  }

  serialize(): string | null {
    if (!this.hasValue()) {
      return null;
    }
    return String(this._value);
  }

  deserialize(value: string): void {
    // Try to parse as number if it's a number filter
    if (this._config.type === 'number') {
      const parsed = parseFloat(value);
      this._value = isNaN(parsed) ? null : (parsed as T);
    } else {
      this._value = value as T;
    }
  }
}
