import {
  Component,
  input,
  output,
  model,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-number-filter',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="number-filter">
      @if (label()) {
        <mat-label>{{ label() }}</mat-label>
      }
      <input
        matInput
        type="number"
        [(ngModel)]="internalValue"
        (ngModelChange)="onValueChange($event)"
        [placeholder]="placeholder()"
        [attr.min]="min()"
        [attr.max]="max()"
      />
      @if (clearable() && internalValue() !== null) {
        <button
          matSuffix
          mat-icon-button
          (click)="clear()"
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
      .number-filter {
        width: 100%;
      }
    `,
  ],
})
export class NumberFilterComponent {
  // Inputs using signal-based API
  id = input.required<string>();
  label = input<string>('');
  placeholder = input<string>('');
  min = input<number | undefined>(undefined);
  max = input<number | undefined>(undefined);
  clearable = input<boolean>(true);
  value = input<number | null>(null);

  // Output using signal-based API
  valueChange = output<number | null>();

  // Internal signal for the current value
  internalValue = model<number | null>(null);

  constructor() {
    // Sync value input to internalValue whenever it changes
    effect(() => {
      const newValue = this.value();
      if (this.internalValue() !== newValue) {
        this.internalValue.set(newValue);
      }
    });
  }

  onValueChange(value: number | null) {
    this.valueChange.emit(value);
  }

  clear() {
    this.internalValue.set(null);
    this.valueChange.emit(null);
  }
}
