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
  step?: number;
  defaultValue?: any;
  required?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  shortcut?: string; // Single keyboard shortcut for toggle (e.g., "ctrl+b")
  shortcuts?: {
    // Multiple shortcuts for increment/decrement
    increment?: string;
    decrement?: string;
  };
}

export interface FilterGroup {
  id: string;
  name: string;
  filters: FilterConfig[];
}

/**
 * Simplified filter group structure for rendering
 * Contains only the structure needed by the UI - filter instances contain all other info
 */
export interface FilterGroupStructure {
  id: string;
  name: string;
  filterIds: Array<{ id: string; type: FilterType }>;
}

export interface FilterState {
  [filterId: string]: any;
}
