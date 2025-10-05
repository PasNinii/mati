import { BaseFilter } from './base-filter.model';
import { FilterConfig } from '../filter-config.interface';

/**
 * Boolean filter for true/false toggles (checkboxes, slide toggles)
 */
export class BooleanFilter extends BaseFilter<boolean> {
  protected getTypeDefaultValue(): boolean {
    return false;
  }

  protected hasValueInternal(): boolean {
    return this._value !== null && this._value !== undefined;
  }

  serialize(): string | null {
    if (!this.hasValue()) {
      return null;
    }
    return this._value ? 'true' : 'false';
  }

  deserialize(value: string): void {
    this._value = value === 'true' || value === '1';
  }

  /**
   * Toggle the boolean value
   */
  toggle(): void {
    this._value = !this._value;
  }
}
