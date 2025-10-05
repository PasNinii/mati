import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { FilterOption } from '../../../pattern/filter/filter-config.interface';
import { BaseFilterComponent } from '../base-filter.component';

@Component({
  selector: 'app-multi-select-filter',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="multi-select-filter">
      @if (label()) {
        <mat-label>{{ label() }}</mat-label>
      }
      <mat-select
        [(ngModel)]="internalValue"
        (ngModelChange)="onValueChange($event)"
        multiple
      >
        @for (option of options(); track option.value) {
          <mat-option [value]="option.value">
            {{ option.label }}
          </mat-option>
        }
      </mat-select>
      @if (clearable() && internalValue().length > 0) {
        <button
          matSuffix
          mat-icon-button
          (click)="clear(); $event.stopPropagation()"
          type="button"
          aria-label="Clear all"
        >
          <mat-icon>close</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
  styles: [
    `
      .multi-select-filter {
        width: 100%;
      }
    `,
  ],
})
export class MultiSelectFilterComponent extends BaseFilterComponent<any[]> {
  // Additional inputs specific to multi-select filter
  options = input<FilterOption[]>([]);
  clearable = input<boolean>(true);

  protected getDefaultValue(): any[] {
    return [];
  }

  protected override valuesEqual(a: any[], b: any[]): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  override onValueChange(value: any[]): void {
    super.onValueChange(value || []);
  }
}
