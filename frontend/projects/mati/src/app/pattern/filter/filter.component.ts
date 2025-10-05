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
import { FilterState } from '../../pattern/filter/filter-config.interface';
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
              [title]="'Clear all filters (Ctrl+R)'"
            >
              <mat-icon>clear_all</mat-icon>
              Clear All
              <span class="keyboard-hint">(Ctrl+R)</span>
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
              @for (filterItem of group.filterIds; track filterItem.id) {
                <div class="filter-item">
                  @switch (filterItem.type) {
                    @case (FilterType.TEXT) {
                      <app-text-filter
                        [filter]="$any(getFilter(filterItem.id))"
                      />
                    }
                    @case (FilterType.SELECT) {
                      <app-select-filter
                        [filter]="$any(getFilter(filterItem.id))"
                      />
                    }
                    @case (FilterType.MULTI_SELECT) {
                      <app-multi-select-filter
                        [filter]="$any(getFilter(filterItem.id))"
                      />
                    }
                    @case (FilterType.NUMBER) {
                      <app-number-filter
                        [filter]="$any(getFilter(filterItem.id))"
                      />
                    }
                    @case (FilterType.BOOLEAN) {
                      <app-boolean-filter
                        [filter]="$any(getFilter(filterItem.id))"
                      />
                    }
                    @case (FilterType.SLIDER) {
                      <app-slider-filter
                        [filter]="$any(getFilter(filterItem.id))"
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
  filterGroups = this.filterService.filterGroups;
  activeFiltersCount = this.filterService.activeFiltersCount;

  constructor() {
    // Effect to emit filter changes whenever filterState changes
    effect(() => {
      const state = this.filterService.filterState();
      // Use queueMicrotask to avoid triggering during change detection
      queueMicrotask(() => {
        this.filtersChanged.emit(state);
      });
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

  getFilter(filterId: string) {
    return this.filterService.filters().get(filterId);
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
