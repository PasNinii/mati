import {
  Component,
  input,
  output,
  model,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-boolean-filter',
  imports: [MatSlideToggleModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="boolean-filter">
      <mat-slide-toggle
        [(ngModel)]="internalValue"
        (ngModelChange)="onValueChange($event)"
        color="primary"
      >
        <span class="filter-label">
          {{ label() }}
          @if (shortcut()) {
            <kbd class="shortcut-badge">{{ shortcut() }}</kbd>
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
export class BooleanFilterComponent {
  // Inputs using signal-based API
  id = input.required<string>();
  label = input<string>('');
  value = input<boolean>(false);
  shortcut = input<string>(''); // Keyboard shortcut to display

  // Output using signal-based API
  valueChange = output<boolean>();

  // Internal signal for the current value
  internalValue = model<boolean>(false);

  constructor() {
    // Sync value input to internalValue whenever it changes
    effect(() => {
      const newValue = this.value();
      if (this.internalValue() !== newValue) {
        this.internalValue.set(newValue);
      }
    });
  }

  onValueChange(checked: boolean) {
    this.internalValue.set(checked);
    this.valueChange.emit(checked);
  }
}
