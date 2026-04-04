import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute, Params } from '@angular/router';
import {
  FilterGroup,
  FilterGroupStructure,
  FilterState,
} from './filter-config.interface';
import { FilterType } from './filter-type.enum';
import { KeyboardShortcutService } from '../../core/services/keyboard-shortcut.service';
import { BaseFilter } from './models';
import { createFilter } from './models/filter.factory';

@Injectable({ providedIn: 'root' })
export class FilterService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly keyboardShortcutService = inject(KeyboardShortcutService);

  // Config path drives httpResource — set via loadFilterConfigs()
  private readonly configPath = signal<string | undefined>(undefined);

  // Signal-based HTTP resource replaces HttpClient + RxJS pipe
  readonly configResource = httpResource<FilterGroup[]>(() => this.configPath());

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

  // Router queryParams as a signal — no manual subscription, no memory leak
  private readonly queryParams = toSignal(this.route.queryParams, {
    initialValue: {} as Params,
  });

  constructor() {
    // Initialize filters when httpResource resolves
    effect(() => {
      const groups = this.configResource.value();
      if (groups) {
        this.initializeFilters(groups);
      }
    });

    // Apply URL params to filters once both are available
    effect(() => {
      const params = this.queryParams();
      const filters = this.filters();
      if (filters.size === 0) return;

      Object.keys(params).forEach((key) => {
        const filter = filters.get(key);
        if (filter) {
          filter.deserialize(params[key]);
        }
      });
    });

    // Sync filter state back to URL
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
  ): void {
    this.configPath.set(configPath);
  }

  public clearAllFilters(): void {
    this.filters().forEach((filter) => filter.clear());
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
    // Clean up shortcuts from previous filters before re-initializing
    this.filters().forEach((filter) => filter.destroyShortcuts());

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
