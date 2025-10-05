import { BaseFilter } from './base-filter.model';
import { FilterConfig } from '../filter-config.interface';

/**
 * Numeric filter with increment/decrement support
 */
export class NumericFilter extends BaseFilter<number> {
  protected getTypeDefaultValue(): number {
    return this.config().min ?? 0;
  }

  protected hasValueInternal(): boolean {
    const val = this.value();
    return val !== null && val !== undefined;
  }

  serialize(): string | null {
    if (!this.hasValue()) {
      return null;
    }
    return String(this.value());
  }

  deserialize(value: string): void {
    const parsed = parseFloat(value);
    this.value.set(isNaN(parsed) ? this.getDefaultValue() : parsed);
  }

  /**
   * Increment the value by step amount
   */
  increment(): void {
    const cfg = this.config();
    const step = cfg.step ?? 1;
    const max = cfg.max ?? Infinity;
    this.value.update((v) => Math.min(v + step, max));
  }

  /**
   * Decrement the value by step amount
   */
  decrement(): void {
    const cfg = this.config();
    const step = cfg.step ?? 1;
    const min = cfg.min ?? -Infinity;
    this.value.update((v) => Math.max(v - step, min));
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
    const cfg = this.config();

    if (cfg.shortcuts?.increment) {
      this.registerShortcut(shortcutService, cfg.shortcuts.increment, () => {
        this.increment();
        onUpdate();
      });
    }

    if (cfg.shortcuts?.decrement) {
      this.registerShortcut(shortcutService, cfg.shortcuts.decrement, () => {
        this.decrement();
        onUpdate();
      });
    }
  }
}
