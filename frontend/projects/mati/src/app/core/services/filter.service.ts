import {
  Injectable,
  signal,
  Signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, map } from 'rxjs';
import { Filter } from '../../pattern/filter/filter.model';
import {
  FilterConfig,
  FilterGroup,
  FilterState,
} from '../../pattern/filter/filter-config.interface';
import { KeyboardShortcutService } from './keyboard-shortcut.service';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly keyboardShortcutService = inject(KeyboardShortcutService);

  private filterConfigs = signal<FilterGroup[]>([]);
  private filters = signal<Map<string, Filter>>(new Map());

  // Computed signal for filter state
  readonly filterState = computed<FilterState>(() => {
    const state: FilterState = {};
    this.filters().forEach((filter) => {
      if (filter.hasValue()) {
        state[filter.id] = filter.value;
      }
    });
    return state;
  });

  // Computed signal for active filters count
  readonly activeFiltersCount = computed(
    () => Object.keys(this.filterState()).length,
  );

  constructor() {
    // Effect to sync filter state to URL in real-time
    effect(() => {
      const state = this.filterState();
      this.updateUrlParams(state);
    });

    // Subscribe to keyboard shortcuts
    console.log('[FilterService] Subscribing to keyboard shortcuts');
    this.keyboardShortcutService.shortcutTriggered.subscribe(
      ({ shortcut, action }) => {
        console.log('[FilterService] Shortcut triggered event received:', {
          shortcut,
          action,
        });
        if (action.filterId) {
          this.handleFilterShortcut(action.filterId, action.action);
        } else {
          console.log('[FilterService] No filterId in action');
        }
      },
    );
  }

  /**
   * Handle keyboard shortcut for a filter
   */
  private handleFilterShortcut(
    filterId: string,
    action: 'toggle' | 'increment' | 'decrement',
  ): void {
    console.log('[FilterService] handleFilterShortcut called:', {
      filterId,
      action,
    });
    const filter = this.getFilter(filterId);
    if (!filter) {
      console.log('[FilterService] Filter not found:', filterId);
      return;
    }

    console.log('[FilterService] Filter found:', {
      id: filter.id,
      value: filter.value,
      type: typeof filter.value,
    });

    switch (action) {
      case 'toggle':
        // Toggle boolean filters
        if (typeof filter.value === 'boolean') {
          console.log(
            '[FilterService] Toggling boolean from',
            filter.value,
            'to',
            !filter.value,
          );
          this.updateFilter(filterId, !filter.value);
        }
        break;
      case 'increment':
        // Increment numeric filters
        if (typeof filter.value === 'number') {
          const max = filter.config.max ?? Infinity;
          const step = filter.config.step ?? 1;
          const newValue = Math.min(filter.value + step, max);
          console.log(
            '[FilterService] Incrementing from',
            filter.value,
            'to',
            newValue,
            { step, max },
          );
          this.updateFilter(filterId, newValue);
        }
        break;
      case 'decrement':
        // Decrement numeric filters
        if (typeof filter.value === 'number') {
          const min = filter.config.min ?? -Infinity;
          const step = filter.config.step ?? 1;
          const newValue = Math.max(filter.value - step, min);
          console.log(
            '[FilterService] Decrementing from',
            filter.value,
            'to',
            newValue,
            { step, min },
          );
          this.updateFilter(filterId, newValue);
        }
        break;
    }
  }

  /**
   * Load filter configurations from JSON file
   */
  loadFilterConfigs(
    configPath: string = 'assets/filters/filter-config.json',
  ): Observable<FilterGroup[]> {
    return this.http.get<FilterGroup[]>(configPath).pipe(
      map((groups) => {
        this.filterConfigs.set(groups);
        this.initializeFilters(groups);
        return groups;
      }),
    );
  }

  /**
   * Initialize filter instances from configurations
   */
  private initializeFilters(groups: FilterGroup[]): void {
    const filterMap = new Map<string, Filter>();

    groups.forEach((group) => {
      group.filters.forEach((config) => {
        filterMap.set(config.id, new Filter(config));

        // Register single keyboard shortcut if defined (for toggle)
        if (config.shortcut) {
          console.log(
            '[FilterService] Registering single shortcut:',
            config.shortcut,
            'for',
            config.id,
          );
          this.keyboardShortcutService.register(config.shortcut, {
            filterId: config.id,
            action: 'toggle',
          });
        }

        // Register increment/decrement shortcuts if defined
        if (config.shortcuts?.increment) {
          console.log(
            '[FilterService] Registering increment shortcut:',
            config.shortcuts.increment,
            'for',
            config.id,
          );
          this.keyboardShortcutService.register(config.shortcuts.increment, {
            filterId: config.id,
            action: 'increment',
          });
        }

        if (config.shortcuts?.decrement) {
          console.log(
            '[FilterService] Registering decrement shortcut:',
            config.shortcuts.decrement,
            'for',
            config.id,
          );
          this.keyboardShortcutService.register(config.shortcuts.decrement, {
            filterId: config.id,
            action: 'decrement',
          });
        }
      });
    });

    this.filters.set(filterMap);
  }

  /**
   * Get all filter groups
   */
  getFilterGroups(): Signal<FilterGroup[]> {
    return this.filterConfigs;
  }

  /**
   * Get a specific filter by ID
   */
  getFilter(filterId: string): Filter | undefined {
    return this.filters().get(filterId);
  }

  /**
   * Get all filters as a map
   */
  getFilters(): Signal<Map<string, Filter>> {
    return this.filters;
  }

  /**
   * Update a filter's value
   */
  updateFilter(filterId: string, value: any): void {
    const filter = this.getFilter(filterId);
    if (filter) {
      filter.value = value;
      this.filters.update((map) => new Map(map));
    }
  }

  /**
   * Clear a specific filter
   */
  clearFilter(filterId: string): void {
    const filter = this.getFilter(filterId);
    if (filter) {
      filter.clear();
      this.filters.update((map) => new Map(map));
    }
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.filters().forEach((filter) => filter.clear());
    this.filters.update((map) => new Map(map));
  }

  /**
   * Get the current filter state
   */
  getFilterState(): FilterState {
    return this.filterState();
  }

  /**
   * Update URL query parameters with current filter state
   */
  private updateUrlParams(state: FilterState): void {
    const queryParams: any = {};

    // Only add non-empty filter values to URL
    Object.entries(state).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams[key] = value;
      }
    });

    // Update URL without reloading the page
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /**
   * Serialize filters to URL-safe string for sharing
   */
  serializeToUrl(): string {
    const state = this.getFilterState();
    const compressed = this.compressState(state);
    return btoa(JSON.stringify(compressed));
  }

  /**
   * Deserialize filters from URL string (for legacy 'filters' param)
   */
  deserializeFromUrl(urlState: string): void {
    try {
      const compressed = JSON.parse(atob(urlState));
      const state = this.decompressState(compressed);
      this.applyFilterState(state);
    } catch (error) {
      console.error('Failed to deserialize filter state:', error);
    }
  }

  /**
   * Load filters from current URL query parameters
   */
  loadFiltersFromUrl(): void {
    this.route.queryParams.subscribe((params) => {
      const state: FilterState = {};

      // Check for legacy 'filters' parameter first
      if (params['filters']) {
        this.deserializeFromUrl(params['filters']);
        return;
      }

      // Load individual filter parameters
      Object.keys(params).forEach((key) => {
        if (this.getFilter(key)) {
          let value = params[key];

          // Convert string 'true'/'false' to boolean
          if (value === 'true') value = true;
          if (value === 'false') value = false;

          // Convert numeric strings to numbers
          if (!isNaN(value) && value !== '') {
            value = Number(value);
          }

          state[key] = value;
        }
      });

      if (Object.keys(state).length > 0) {
        this.applyFilterState(state);
      }
    });
  }

  /**
   * Apply a filter state
   */
  applyFilterState(state: FilterState): void {
    Object.entries(state).forEach(([filterId, value]) => {
      this.updateFilter(filterId, value);
    });
  }

  /**
   * Compress state for URL (remove null/empty values, shorten keys)
   */
  private compressState(state: FilterState): any {
    const compressed: any = {};
    Object.entries(state).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Use shorter keys for common filter IDs if needed
        compressed[key] = value;
      }
    });
    return compressed;
  }

  /**
   * Decompress state from URL
   */
  private decompressState(compressed: any): FilterState {
    // Expand shortened keys back to full filter IDs if needed
    return compressed;
  }

  /**
   * Get active filters count
   */
  getActiveFiltersCount(): number {
    return this.activeFiltersCount();
  }

  /**
   * Check if any filter is active
   */
  hasActiveFilters(): boolean {
    return this.getActiveFiltersCount() > 0;
  }

  /**
   * Get filters by group ID
   */
  getFiltersByGroup(groupId: string): Filter[] {
    const group = this.filterConfigs().find((g) => g.id === groupId);
    if (!group) return [];

    return group.filters
      .map((config) => this.getFilter(config.id))
      .filter((f): f is Filter => f !== undefined);
  }
}
