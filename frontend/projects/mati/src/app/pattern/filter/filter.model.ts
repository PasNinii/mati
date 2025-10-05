import { FilterConfig, FilterState } from './filter-config.interface';
import { FilterType } from './filter-type.enum';

export class Filter {
  private _config: FilterConfig;
  private _value: any;

  constructor(config: FilterConfig) {
    this._config = config;
    this._value = config.defaultValue ?? null;
  }

  get config(): FilterConfig {
    return this._config;
  }

  get value(): any {
    return this._value;
  }

  set value(val: any) {
    this._value = val;
  }

  get id(): string {
    return this._config.id;
  }

  get label(): string {
    return this._config.label;
  }

  get type(): FilterType {
    return this._config.type;
  }

  hasValue(): boolean {
    // Non-clearable filters always have a value (even if 0 or default)
    if (this._config.clearable === false) {
      return true;
    }

    if (this._value === null || this._value === undefined) {
      return false;
    }
    if (Array.isArray(this._value)) {
      return this._value.length > 0;
    }
    if (typeof this._value === 'string') {
      return this._value.trim().length > 0;
    }
    return true;
  }

  clear(): void {
    this._value = this._config.defaultValue ?? null;
  }

  toJSON(): any {
    return {
      id: this.id,
      value: this._value,
    };
  }

  static fromJSON(config: FilterConfig, json: any): Filter {
    const filter = new Filter(config);
    filter.value = json.value;
    return filter;
  }
}
