import { FilterConfig } from '../filter-config.interface';
import { FilterType } from '../filter-type.enum';
import {
  BaseFilter,
  BooleanFilter,
  SingleValueFilter,
  NumericFilter,
  ArrayFilter,
} from './index';

/**
 * Factory function to create the appropriate filter instance based on config
 */
export function createFilter(config: FilterConfig): BaseFilter {
  switch (config.type) {
    case FilterType.BOOLEAN:
      return new BooleanFilter(config);

    case FilterType.NUMBER:
    case FilterType.SLIDER:
      return new NumericFilter(config);

    case FilterType.MULTI_SELECT:
      return new ArrayFilter(config);

    case FilterType.TEXT:
    case FilterType.SELECT:
    default:
      return new SingleValueFilter(config);
  }
}
