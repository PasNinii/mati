import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { BaseFilterComponent } from '../../../pattern/filter/base-filter.component';

@Component({
  selector: 'mati-select-filter',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="select-filter">
      @if (filter().config().label) {
        <mat-label>{{ filter().config().label }}</mat-label>
      }
      <mat-select
        [ngModel]="filter().value()"
        (ngModelChange)="onValueChange($event)"
        [placeholder]="filter().config().placeholder || 'Select...'"
      >
        @for (option of filter().config().options || []; track option.value) {
          <mat-option [value]="option.value">
            {{ option.label }}
          </mat-option>
        }
      </mat-select>
      @if (filter().config().clearable !== false && filter().value() !== null) {
        <button
          matSuffix
          mat-icon-button
          (click)="clear(); $event.stopPropagation()"
          type="button"
          aria-label="Clear"
        >
          <mat-icon>close</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
  styles: [
    `
      .select-filter {
        width: 100%;
      }
    `,
  ],
})
export class SelectFilterComponent extends BaseFilterComponent<
  string | number | null
> {}
