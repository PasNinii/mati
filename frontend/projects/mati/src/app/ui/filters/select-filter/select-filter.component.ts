import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { FilterOption } from '../../../pattern/filter/filter-config.interface';
import { BaseFilterComponent } from '../base-filter.component';

@Component({
  selector: 'app-select-filter',
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
      @if (label()) {
        <mat-label>{{ label() }}</mat-label>
      }
      <mat-select
        [(ngModel)]="internalValue"
        (ngModelChange)="onValueChange($event)"
        [placeholder]="placeholder()"
      >
        @for (option of options(); track option.value) {
          <mat-option [value]="option.value">
            {{ option.label }}
          </mat-option>
        }
      </mat-select>
      @if (clearable() && internalValue() !== null) {
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
export class SelectFilterComponent extends BaseFilterComponent<any> {
  // Additional inputs specific to select filter
  placeholder = input<string>('Select...');
  options = input<FilterOption[]>([]);
  clearable = input<boolean>(true);

  protected getDefaultValue(): any {
    return null;
  }
}
