import { FilterConfig } from '../filter-config.interface';
import { FilterType } from '../filter-type.enum';
import {
  BaseFilter,
  BooleanFilter,
  TextFilter,
  SelectFilter,
  NumberFilter,
  NumericFilter,
  ArrayFilter,
} from './index';

/**
 * Factory function to create the appropriate filter instance based on config
 */
export function createFilter(config: FilterConfig): BaseFilter {
  switch (config.type) {
    case FilterType.BOOLEAN:
      return new BooleanFilter(config) as BaseFilter;

    case FilterType.SLIDER:
      return new NumericFilter(config) as BaseFilter;

    case FilterType.NUMBER:
      return new NumberFilter(config) as BaseFilter;

    case FilterType.MULTI_SELECT:
      return new ArrayFilter(config) as BaseFilter;

    case FilterType.SELECT:
      return new SelectFilter(config) as BaseFilter;

    case FilterType.TEXT:
    default:
      return new TextFilter(config) as BaseFilter;
  }
}
