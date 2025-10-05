import { BaseFilter } from './base-filter.model';

/**
 * Numeric filter with increment/decrement support
 */
export class NumericFilter extends BaseFilter<number> {
  protected getTypeDefaultValue(): number {
    return this._config.min ?? 0;
  }

  protected hasValueInternal(): boolean {
    return this._value !== null && this._value !== undefined;
  }

  serialize(): string | null {
    if (!this.hasValue()) {
      return null;
    }
    return String(this._value);
  }

  deserialize(value: string): void {
    const parsed = parseFloat(value);
    this._value = isNaN(parsed) ? this.getDefaultValue() : parsed;
  }

  /**
   * Increment the value by step amount
   */
  increment(): void {
    const step = this._config.step ?? 1;
    const max = this._config.max ?? Infinity;
    this._value = Math.min(this._value + step, max);
  }

  /**
   * Decrement the value by step amount
   */
  decrement(): void {
    const step = this._config.step ?? 1;
    const min = this._config.min ?? -Infinity;
    this._value = Math.max(this._value - step, min);
  }

  /**
   * Initialize shortcuts for numeric filter
   */
  override initShortcuts(
    shortcutService: {
      register: (shortcut: string, handler: () => void) => () => void;
    },
    onUpdate: () => void,
  ): void {
    if (this._config.shortcuts?.increment) {
      this.registerShortcut(
        shortcutService,
        this._config.shortcuts.increment,
        () => {
          this.increment();
          onUpdate();
        },
      );
    }

    if (this._config.shortcuts?.decrement) {
      this.registerShortcut(
        shortcutService,
        this._config.shortcuts.decrement,
        () => {
          this.decrement();
          onUpdate();
        },
      );
    }
  }
}
