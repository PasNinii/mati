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
export class SelectFilterComponent {
  // Inputs using signal-based API
  id = input.required<string>();
  label = input<string>('');
  placeholder = input<string>('Select...');
  options = input<FilterOption[]>([]);
  clearable = input<boolean>(true);
  value = input<any>(null);

  // Output using signal-based API
  valueChange = output<any>();

  // Internal signal for the current value
  internalValue = model<any>(null);

  constructor() {
    // Sync value input to internalValue whenever it changes
    effect(() => {
      const newValue = this.value();
      if (this.internalValue() !== newValue) {
        this.internalValue.set(newValue);
      }
    });
  }

  onValueChange(value: any) {
    this.valueChange.emit(value);
  }

  clear() {
    this.internalValue.set(null);
    this.valueChange.emit(null);
  }
}
