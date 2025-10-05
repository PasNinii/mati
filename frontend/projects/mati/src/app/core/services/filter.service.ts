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
  FilterGroupStructure,
  FilterState,
} from '../../pattern/filter/filter-config.interface';
import { FilterType } from '../../pattern/filter/filter-type.enum';
import { KeyboardShortcutService } from './keyboard-shortcut.service';
import { BaseFilter } from '../../pattern/filter/models';
import { createFilter } from '../../pattern/filter/models/filter.factory';

@Injectable({ providedIn: 'root' })
export class FilterService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly keyboardShortcutService = inject(KeyboardShortcutService);

  // Filters map - centralized source of truth containing all filter instances
  public readonly filters = signal<Map<string, BaseFilter>>(new Map());

  // Simplified group structure - only contains structure for rendering, not full configs
  public readonly filterGroups = signal<FilterGroupStructure[]>([]);

  // Computed signal for filter state (returns actual values, not serialized)
  public readonly filterState = computed<FilterState>(() => {
    const state: FilterState = {};
    this.filters().forEach((filter) => {
      if (filter.hasValue()) {
        state[filter.id] = filter.value();
      }
    });
    return state;
  });

  // Computed signal for active filters count
  public readonly activeFiltersCount = computed(
    () => Object.keys(this.filterState()).length,
  );

  // Computed signal for checking if any filter is active
  public readonly hasActiveFilters = computed(
    () => this.activeFiltersCount() > 0,
  );

  constructor() {
    // Effect to sync filter state to URL in real-time
    effect(() => {
      const state = this.filterState();
      this.updateUrlParams(state);
    });

    // Register global keyboard shortcut to clear all filters
    this.keyboardShortcutService.register('ctrl+r', () => {
      this.clearAllFilters();
    });
  }

  /**
   * Load filter configurations from JSON file
   */
  loadFilterConfigs(
    configPath: string = 'assets/filters/filter-config.json',
  ): Observable<FilterGroup[]> {
    return this.http.get<FilterGroup[]>(configPath).pipe(
      map((groups) => {
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
    const groupStructures: FilterGroupStructure[] = [];

    groups.forEach((group) => {
      const filterIds: Array<{ id: string; type: FilterType }> = [];

      group.filters.forEach((config) => {
        // Use factory to create appropriate filter type
        const filter = createFilter(config);
        filterMap.set(config.id, filter);
        filterIds.push({ id: config.id, type: config.type });

        // Let each filter register its own shortcuts
        filter.initShortcuts(this.keyboardShortcutService, () => {
          // Trigger is handled by filter's value signal
          // No need to update the map
        });
      });

      groupStructures.push({
        id: group.id,
        name: group.name,
        filterIds,
      });
    });

    this.filters.set(filterMap);
    this.filterGroups.set(groupStructures);
  }

  /**
   * Get a specific filter by ID
   */
  getFilter(filterId: string): BaseFilter | undefined {
    return this.filters().get(filterId);
  }

  /**
   * Update a filter's value
   */
  updateFilter(filterId: string, value: any): void {
    const filter = this.getFilter(filterId);
    if (filter) {
      filter.value.set(value);
      // No need to update the filters map as the value signal will trigger reactivity
    }
  }

  public clearAllFilters(): void {
    this.filters().forEach((filter) => filter.clear());
  }

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

  public loadFiltersFromUrl(): void {
    this.route.queryParams.subscribe((params) => {
      // Load individual filter parameters
      Object.keys(params).forEach((key) => {
        const filter = this.getFilter(key);
        if (filter) {
          // Use the filter's deserialize method
          filter.deserialize(params[key]);
        }
      });
      // No need to update the filters map as the value signals will trigger reactivity
    });
  }
}
