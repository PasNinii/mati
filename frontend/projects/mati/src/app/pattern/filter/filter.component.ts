import {
  Component,
  input,
  output,
  inject,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { FilterService } from './filter.service';
import { FilterState } from './filter-config.interface';

@Component({
  selector: 'mati-filter',
  imports: [
    NgComponentOutlet,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
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
                  <ng-container
                    *ngComponentOutlet="
                      getFilter(filterItem.id)!.component;
                      inputs: { filter: getFilter(filterItem.id) }
                    "
                  />
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
export class FilterComponent {
  private readonly filterService = inject(FilterService);

  configPath = input<string>('assets/filters/filter-config.json');
  showGroupNames = input<boolean>(true);
  showClearAll = input<boolean>(true);
  showShare = input<boolean>(true);

  filtersChanged = output<FilterState>();

  filterGroups = this.filterService.filterGroups;
  activeFiltersCount = this.filterService.activeFiltersCount;

  constructor() {
    // Trigger config loading — httpResource in FilterService handles the rest
    effect(() => {
      this.filterService.loadFilterConfigs(this.configPath());
    });

    effect(() => {
      const state = this.filterService.filterState();
      queueMicrotask(() => {
        this.filtersChanged.emit(state);
      });
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
