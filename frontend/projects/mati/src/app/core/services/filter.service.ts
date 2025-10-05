import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Observable, map } from 'rxjs';
import {
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

  public readonly filterState = computed<FilterState>(() => {
    const state: FilterState = {};
    this.filters().forEach((filter) => {
      if (filter.hasValue()) {
        state[filter.id] = filter.value() as
          | string
          | number
          | boolean
          | string[]
          | number[];
      }
    });
    return state;
  });

  public readonly activeFiltersCount = computed(
    () => Object.keys(this.filterState()).length,
  );

  constructor() {
    effect(() => {
      const state = this.filterState();
      this.updateUrlParams(state);
    });

    this.keyboardShortcutService.register('ctrl+a', () => {
      this.clearAllFilters();
    });
  }

  public loadFilterConfigs(
    configPath: string = 'assets/filters/filter-config.json',
  ): Observable<FilterGroup[]> {
    return this.http.get<FilterGroup[]>(configPath).pipe(
      map((groups) => {
        this.initializeFilters(groups);
        return groups;
      }),
    );
  }

  public clearAllFilters(): void {
    this.filters().forEach((filter) => filter.clear());
  }

  public loadFiltersFromUrl(): void {
    this.route.queryParams.subscribe((params) => {
      Object.keys(params).forEach((key) => {
        const filter = this.filters().get(key);
        if (filter) {
          filter.deserialize(params[key]);
        }
      });
    });
  }

  private updateUrlParams(state: FilterState): void {
    const queryParams: Params = {};

    Object.keys(state).forEach((key) => {
      const filter = this.filters().get(key);
      if (filter) {
        const serialized = filter.serialize();
        if (serialized !== null) {
          queryParams[key] = serialized;
        }
      }
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private initializeFilters(groups: FilterGroup[]): void {
    const filterMap = new Map<string, BaseFilter>();
    const groupStructures: FilterGroupStructure[] = [];

    groups.forEach((group) => {
      const filterIds: Array<{ id: string; type: FilterType }> = [];

      group.filters.forEach((config) => {
        const filter = createFilter(config);
        filterMap.set(config.id, filter);
        filterIds.push({ id: config.id, type: config.type });
        filter.initShortcuts(this.keyboardShortcutService);
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
}
