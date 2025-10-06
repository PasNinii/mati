import { Type } from '@angular/core';
import { BaseFilter } from './base-filter.model';
import { TextFilterComponent } from '../components/text-filter/text-filter.component';
import { SelectFilterComponent } from '../components/select-filter/select-filter.component';
import { NumberFilterComponent } from '../components/number-filter/number-filter.component';
import { BaseFilterComponent } from '../base-filter.component';

/**
 * Base class for single value filters
 */
abstract class BaseSingleValueFilter<
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

/**
 * Text filter for string inputs
 */
export class TextFilter extends BaseSingleValueFilter<string> {
  public override readonly component: Type<BaseFilterComponent<string | null>> =
    TextFilterComponent as Type<BaseFilterComponent<string | null>>;
}

/**
 * Select filter for dropdown selection
 */
export class SelectFilter extends BaseSingleValueFilter<string | number> {
  public override readonly component: Type<
    BaseFilterComponent<string | number | null>
  > = SelectFilterComponent as Type<
    BaseFilterComponent<string | number | null>
  >;
}

/**
 * Number filter for numeric inputs
 */
export class NumberFilter extends BaseSingleValueFilter<number> {
  public override readonly component: Type<BaseFilterComponent<number | null>> =
    NumberFilterComponent as Type<BaseFilterComponent<number | null>>;
}

// Keep the generic one for backwards compatibility
export class SingleValueFilter<
  T extends string | number = string | number,
> extends BaseSingleValueFilter<T> {}
