import {
  Component,
  input,
  output,
  model,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-slider-filter',
  imports: [MatSliderModule, MatFormFieldModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="slider-filter">
      @if (label()) {
        <label class="slider-label"
          >{{ label() }}: {{ internalValue() }}{{ unit() }}</label
        >
      }
      <mat-slider
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [discrete]="true"
        [showTickMarks]="showTickMarks()"
        color="primary"
      >
        <input
          matSliderThumb
          [(ngModel)]="internalValue"
          (ngModelChange)="onValueChange($event)"
        />
      </mat-slider>
    </div>
  `,
  styles: [
    `
      .slider-filter {
        width: 100%;
        padding: 0.5rem 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .slider-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }

      :host-context(.dark-theme) .slider-label {
        color: rgba(255, 255, 255, 0.87);
      }

      mat-slider {
        width: 100%;
      }
    `,
  ],
})
export class SliderFilterComponent {
  // Inputs using signal-based API
  id = input.required<string>();
  label = input<string>('');
  min = input<number>(0);
  max = input<number>(100);
  step = input<number>(1);
  value = input<number>(0);
  unit = input<string>('');
  showTickMarks = input<boolean>(false);

  // Output using signal-based API
  valueChange = output<number>();

  // Internal signal for the current value
  internalValue = model<number>(0);

  constructor() {
    // Sync value input to internalValue whenever it changes
    effect(() => {
      const newValue = this.value();
      if (this.internalValue() !== newValue) {
        this.internalValue.set(newValue);
      }
    });
  }

  onValueChange(value: number) {
    this.valueChange.emit(value);
  }
}
