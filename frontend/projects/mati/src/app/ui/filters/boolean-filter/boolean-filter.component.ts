import {
  Component,
  input,
  output,
  model,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-boolean-filter',
  imports: [MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="boolean-filter">
      <mat-slide-toggle
        [checked]="internalValue()"
        (change)="onValueChange($event.checked)"
        color="primary"
      >
        {{ label() }}
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
    `,
  ],
})
export class BooleanFilterComponent {
  // Inputs using signal-based API
  id = input.required<string>();
  label = input<string>('');
  value = input<boolean>(false);

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
