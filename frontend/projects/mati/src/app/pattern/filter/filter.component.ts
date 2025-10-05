import {
  Component,
  input,
  output,
  OnInit,
  inject,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { FilterService } from '../../core/services/filter.service';
import {
  FilterGroup,
  FilterState,
} from '../../pattern/filter/filter-config.interface';
import { FilterType } from '../../pattern/filter/filter-type.enum';
import { TextFilterComponent } from '../../ui/filters/text-filter/text-filter.component';
import { SelectFilterComponent } from '../../ui/filters/select-filter/select-filter.component';
import { MultiSelectFilterComponent } from '../../ui/filters/multi-select-filter/multi-select-filter.component';
import { NumberFilterComponent } from '../../ui/filters/number-filter/number-filter.component';
import { BooleanFilterComponent } from '../../ui/filters/boolean-filter/boolean-filter.component';
import { SliderFilterComponent } from '../../ui/filters/slider-filter/slider-filter.component';

@Component({
  selector: 'app-filter',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    TextFilterComponent,
    SelectFilterComponent,
    MultiSelectFilterComponent,
    NumberFilterComponent,
    BooleanFilterComponent,
    SliderFilterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filter-container">
      <div class="filter-header">
        <h3 class="filter-title">Filters</h3>
        <div class="filter-actions">
          @if (activeFiltersCount() > 0) {
            <mat-chip-set aria-label="Active filters">
              <mat-chip>{{ activeFiltersCount() }} active</mat-chip>
            </mat-chip-set>
          }
          @if (showClearAll() && activeFiltersCount() > 0) {
            <button
              mat-stroked-button
              color="warn"
              (click)="clearAll()"
              type="button"
            >
              <mat-icon>clear_all</mat-icon>
              Clear All
            </button>
          }
          @if (showShare() && activeFiltersCount() > 0) {
            <button
              mat-stroked-button
              color="primary"
              (click)="shareFilters()"
              type="button"
            >
              <mat-icon>share</mat-icon>
              Share
            </button>
          }
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="filter-groups">
        @for (group of filterGroups(); track group.id) {
          <div class="filter-group">
            @if (showGroupNames()) {
              <h4 class="group-name">{{ group.name }}</h4>
            }
            <div class="filter-items">
              @for (filterConfig of group.filters; track filterConfig.id) {
                <div class="filter-item">
                  @switch (filterConfig.type) {
                    @case (FilterType.TEXT) {
                      <app-text-filter
                        [id]="filterConfig.id"
                        [label]="filterConfig.label"
                        [placeholder]="filterConfig.placeholder || ''"
                        [clearable]="filterConfig.clearable ?? true"
                        [value]="getFilterValue(filterConfig.id)"
                        (valueChange)="onFilterChange(filterConfig.id, $event)"
                      />
                    }
                    @case (FilterType.SELECT) {
                      <app-select-filter
                        [id]="filterConfig.id"
                        [label]="filterConfig.label"
                        [placeholder]="filterConfig.placeholder || ''"
                        [options]="filterConfig.options || []"
                        [clearable]="filterConfig.clearable ?? true"
                        [value]="getFilterValue(filterConfig.id)"
                        (valueChange)="onFilterChange(filterConfig.id, $event)"
                      />
                    }
                    @case (FilterType.MULTI_SELECT) {
                      <app-multi-select-filter
                        [id]="filterConfig.id"
                        [label]="filterConfig.label"
                        [options]="filterConfig.options || []"
                        [clearable]="filterConfig.clearable ?? true"
                        [value]="getFilterValue(filterConfig.id)"
                        (valueChange)="onFilterChange(filterConfig.id, $event)"
                      />
                    }
                    @case (FilterType.NUMBER) {
                      <app-number-filter
                        [id]="filterConfig.id"
                        [label]="filterConfig.label"
                        [placeholder]="filterConfig.placeholder || ''"
                        [min]="filterConfig.min"
                        [max]="filterConfig.max"
                        [clearable]="filterConfig.clearable ?? true"
                        [value]="getFilterValue(filterConfig.id)"
                        (valueChange)="onFilterChange(filterConfig.id, $event)"
                      />
                    }
                    @case (FilterType.BOOLEAN) {
                      <app-boolean-filter
                        [id]="filterConfig.id"
                        [label]="filterConfig.label"
                        [value]="getFilterValue(filterConfig.id)"
                        (valueChange)="onFilterChange(filterConfig.id, $event)"
                      />
                    }
                    @case (FilterType.SLIDER) {
                      <app-slider-filter
                        [id]="filterConfig.id"
                        [label]="filterConfig.label"
                        [min]="filterConfig.min ?? 0"
                        [max]="filterConfig.max ?? 100"
                        [value]="getFilterValue(filterConfig.id)"
                        (valueChange)="onFilterChange(filterConfig.id, $event)"
                      />
                    }
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./filter.component.scss'],
})
export class FilterComponent implements OnInit {
  private readonly filterService = inject(FilterService);

  // Inputs using signal-based API
  configPath = input<string>('assets/filters/filter-config.json');
  showGroupNames = input<boolean>(true);
  showClearAll = input<boolean>(true);
  showShare = input<boolean>(true);

  // Outputs using signal-based API
  filtersChanged = output<FilterState>();

  FilterType = FilterType;
  filterGroups = this.filterService.getFilterGroups();
  activeFiltersCount = this.filterService.activeFiltersCount;

  constructor() {
    // Effect to emit filter changes
    effect(() => {
      const state = this.filterService.filterState();
      this.filtersChanged.emit(state);
    });
  }

  ngOnInit() {
    // Load filter configurations
    this.filterService.loadFilterConfigs(this.configPath()).subscribe({
      next: () => {
        this.filterService.loadFiltersFromUrl();
      },
      error: (error) => {
        console.error('Failed to load filter configurations:', error);
      },
    });
  }

  getFilterValue(filterId: string): any {
    const filter = this.filterService.getFilter(filterId);
    return filter?.value;
  }

  onFilterChange(filterId: string, value: any) {
    this.filterService.updateFilter(filterId, value);
  }

  clearAll() {
    this.filterService.clearAllFilters();
  }

  shareFilters() {
    const url = window.location.href;

    // Copy to clipboard
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert('Filter URL copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy URL:', err);
      });
  }
}
