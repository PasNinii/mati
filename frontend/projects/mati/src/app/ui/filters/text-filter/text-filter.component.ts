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
  selector: 'app-text-filter',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="text-filter">
      @if (label()) {
        <mat-label>{{ label() }}</mat-label>
      }
      <input
        matInput
        type="text"
        [(ngModel)]="internalValue"
        (ngModelChange)="onValueChange($event)"
        [placeholder]="placeholder()"
      />
      @if (clearable() && internalValue()) {
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
      .text-filter {
        width: 100%;
      }
    `,
  ],
})
export class TextFilterComponent {
  // Inputs using signal-based API
  id = input.required<string>();
  label = input<string>('');
  placeholder = input<string>('');
  clearable = input<boolean>(true);
  value = input<string>('');

  // Output using signal-based API
  valueChange = output<string>();

  // Internal signal for the current value
  internalValue = model<string>('');

  constructor() {
    // Sync value input to internalValue whenever it changes
    effect(() => {
      const newValue = this.value();
      if (this.internalValue() !== newValue) {
        this.internalValue.set(newValue);
      }
    });
  }

  onValueChange(value: string) {
    this.valueChange.emit(value);
  }

  clear() {
    this.internalValue.set('');
    this.valueChange.emit('');
  }
}
