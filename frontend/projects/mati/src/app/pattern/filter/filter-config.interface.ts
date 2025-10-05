import { FilterType } from './filter-type.enum';

export interface FilterOption {
  label: string;
  value: any;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: FilterType;
  placeholder?: string;
  options?: FilterOption[];
  min?: number;
  max?: number;
  defaultValue?: any;
  required?: boolean;
  multiple?: boolean;
  clearable?: boolean;
}

export interface FilterGroup {
  id: string;
  name: string;
  filters: FilterConfig[];
}

export interface FilterState {
  [filterId: string]: any;
}
