import {
  Component,
  input,
  output,
  model,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { FilterOption } from '../../../pattern/filter/filter-config.interface';

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
export class MultiSelectFilterComponent {
  // Inputs using signal-based API
  id = input.required<string>();
  label = input<string>('');
  options = input<FilterOption[]>([]);
  clearable = input<boolean>(true);
  value = input<any[]>([]);

  // Output using signal-based API
  valueChange = output<any[]>();

  // Internal signal for the current value
  internalValue = model<any[]>([]);

  constructor() {
    // Sync value input to internalValue whenever it changes
    effect(() => {
      const newValue = this.value() || [];
      const currentValue = this.internalValue();
      if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
        this.internalValue.set(newValue);
      }
    });
  }

  onValueChange(value: any[]) {
    this.valueChange.emit(value || []);
  }

  clear() {
    this.internalValue.set([]);
    this.valueChange.emit([]);
  }
}
