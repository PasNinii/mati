import { BaseFilter } from './base-filter.model';
import { FilterConfig } from '../filter-config.interface';

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
    const val = this.value();

    if (val === null || val === undefined) {
      return false;
    }

    if (typeof val === 'string') {
      return val.trim().length > 0;
    }

    // For numbers, including 0 is a valid value
    return true;
  }

  serialize(): string | null {
    if (!this.hasValue()) {
      return null;
    }
    return String(this.value());
  }

  deserialize(value: string): void {
    const cfg = this.config();

    // Try to parse as number if it's a number filter
    if (cfg.type === 'number') {
      const parsed = parseFloat(value);
      this.value.set(isNaN(parsed) ? null : (parsed as T));
    } else {
      this.value.set(value as T);
    }
  }

  /**
   * Single value filters don't use keyboard shortcuts
   */
  override initShortcuts(): void {
    // No shortcuts for single value filters
  }
}
