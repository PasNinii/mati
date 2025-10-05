import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BaseFilterComponent } from '../base-filter.component';

@Component({
  selector: 'app-boolean-filter',
  imports: [MatSlideToggleModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="boolean-filter">
      <mat-slide-toggle
        [ngModel]="filter().value()"
        (ngModelChange)="onValueChange($event)"
        color="primary"
        [disableRipple]="false"
      >
        <span class="filter-label">
          {{ filter().config().label }}
          @if (filter().config().shortcut) {
            <kbd class="shortcut-badge">{{ filter().config().shortcut }}</kbd>
          }
        </span>
      </mat-slide-toggle>
    </div>
  `,
  styles: [
    `
      .boolean-filter {
        display: flex;
        align-items: center;
        padding: 0.5rem 0;
        transition: background-color 0.2s;
      }

      mat-slide-toggle {
        width: 100%;
      }

      .filter-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .shortcut-badge {
        font-size: 0.7rem;
        padding: 0.125rem 0.375rem;
        background: rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 0.25rem;
        font-family: monospace;
        opacity: 0.7;
      }

      :host-context(.dark-theme) .shortcut-badge {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
      }
    `,
  ],
})
export class BooleanFilterComponent extends BaseFilterComponent<boolean> {}
