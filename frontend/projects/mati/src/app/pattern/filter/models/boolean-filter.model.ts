import { Type } from '@angular/core';
import { BaseFilter } from './base-filter.model';
import { BaseFilterComponent } from '../../../ui/filters/base-filter.component';
import { BooleanFilterComponent } from '../../../ui/filters/boolean-filter/boolean-filter.component';

/**
 * Boolean filter for true/false toggles (checkboxes, slide toggles)
 */
export class BooleanFilter extends BaseFilter<boolean> {
  public override readonly component: Type<BaseFilterComponent<boolean>> =
    BooleanFilterComponent as Type<BaseFilterComponent<boolean>>;

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
  override initShortcuts(shortcutService: {
    register: (shortcut: string, handler: () => void) => () => void;
  }): void {
    const cfg = this.config();
    if (cfg.shortcut) {
      this.registerShortcut(shortcutService, cfg.shortcut, () => {
        this.toggle();
      });
    }
  }
}
