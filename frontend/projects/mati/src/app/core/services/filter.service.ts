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
import {
  FilterConfig,
  FilterGroup,
  FilterState,
} from '../../pattern/filter/filter-config.interface';
import { KeyboardShortcutService } from './keyboard-shortcut.service';
import {
  BaseFilter,
  BooleanFilter,
  NumericFilter,
} from '../../pattern/filter/models';
import { createFilter } from '../../pattern/filter/models/filter.factory';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly keyboardShortcutService = inject(KeyboardShortcutService);

  private filterConfigs = signal<FilterGroup[]>([]);
  private filters = signal<Map<string, BaseFilter>>(new Map());

  // Computed signal for filter state (returns actual values, not serialized)
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

  // Computed signal for checking if any filter is active
  readonly hasActiveFilters = computed(() => this.activeFiltersCount() > 0);

  constructor() {
    // Effect to sync filter state to URL in real-time
    effect(() => {
      const state = this.filterState();
      this.updateUrlParams(state);
    });

    // Subscribe to keyboard shortcuts
    this.keyboardShortcutService.shortcutTriggered.subscribe(
      ({ shortcut, action }) => {
        if (action.filterId) {
          this.handleFilterShortcut(action.filterId, action.action);
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
    const filter = this.getFilter(filterId);
    if (!filter) {
      return;
    }

    switch (action) {
      case 'toggle':
        // Toggle boolean filters
        if (filter instanceof BooleanFilter) {
          filter.toggle();
          this.filters.update((map) => new Map(map));
        }
        break;
      case 'increment':
        // Increment numeric filters
        if (filter instanceof NumericFilter) {
          filter.increment();
          this.filters.update((map) => new Map(map));
        }
        break;
      case 'decrement':
        // Decrement numeric filters
        if (filter instanceof NumericFilter) {
          filter.decrement();
          this.filters.update((map) => new Map(map));
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
    const filterMap = new Map<string, BaseFilter>();

    groups.forEach((group) => {
      group.filters.forEach((config) => {
        // Use factory to create appropriate filter type
        const filter = createFilter(config);
        filterMap.set(config.id, filter);

        // Register keyboard shortcuts for this filter
        this.registerFilterShortcuts(filter);
      });
    });

    this.filters.set(filterMap);
  }

  /**
   * Register keyboard shortcuts for a filter
   */
  private registerFilterShortcuts(filter: BaseFilter): void {
    const config = filter.config;

    // Register toggle shortcut (for boolean filters)
    if (config.shortcut) {
      this.keyboardShortcutService.register(config.shortcut, {
        filterId: filter.id,
        action: 'toggle',
      });
    }

    // Register increment/decrement shortcuts (for numeric filters)
    if (config.shortcuts?.increment) {
      this.keyboardShortcutService.register(config.shortcuts.increment, {
        filterId: filter.id,
        action: 'increment',
      });
    }

    if (config.shortcuts?.decrement) {
      this.keyboardShortcutService.register(config.shortcuts.decrement, {
        filterId: filter.id,
        action: 'decrement',
      });
    }
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
  getFilter(filterId: string): BaseFilter | undefined {
    return this.filters().get(filterId);
  }

  /**
   * Get all filters as a map
   */
  getFilters(): Signal<Map<string, BaseFilter>> {
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
   * Update URL query parameters with current filter state
   */
  private updateUrlParams(state: FilterState): void {
    const queryParams: any = {};

    // Serialize filter values for URL
    Object.entries(state).forEach(([key, value]) => {
      const filter = this.getFilter(key);
      if (filter) {
        const serialized = filter.serialize();
        if (serialized !== null) {
          queryParams[key] = serialized;
        }
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
   * Load filters from current URL query parameters
   */
  loadFiltersFromUrl(): void {
    this.route.queryParams.subscribe((params) => {
      // Load individual filter parameters
      Object.keys(params).forEach((key) => {
        const filter = this.getFilter(key);
        if (filter) {
          // Use the filter's deserialize method
          filter.deserialize(params[key]);
        }
      });

      // Trigger update to notify subscribers
      this.filters.update((map) => new Map(map));
    });
  }

  /**
   * Get filters by group ID
   */
  getFiltersByGroup(groupId: string): BaseFilter[] {
    const group = this.filterConfigs().find((g) => g.id === groupId);
    if (!group) return [];

    return group.filters
      .map((config) => this.getFilter(config.id))
      .filter((f): f is BaseFilter => f !== undefined);
  }
}
