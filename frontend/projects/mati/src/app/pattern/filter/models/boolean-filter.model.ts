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
    const val = this.value();
    return val !== null && val !== undefined;
  }

  serialize(): string | null {
    if (!this.hasValue()) {
      return null;
    }
    return this.value() ? 'true' : 'false';
  }

  deserialize(value: string): void {
    this.value.set(value === 'true' || value === '1');
  }

  /**
   * Toggle the boolean value
   */
  toggle(): void {
    this.value.update((v) => !v);
  }

  /**
   * Initialize shortcuts for boolean filter
   */
  override initShortcuts(
    shortcutService: {
      register: (shortcut: string, handler: () => void) => () => void;
    },
    onUpdate: () => void,
  ): void {
    const cfg = this.config();
    if (cfg.shortcut) {
      this.registerShortcut(shortcutService, cfg.shortcut, () => {
        this.toggle();
        onUpdate();
      });
    }
  }
}
