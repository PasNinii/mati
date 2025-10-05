import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { BaseFilterComponent } from '../base-filter.component';

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
export class SliderFilterComponent extends BaseFilterComponent<number> {
  // Additional inputs specific to slider filter
  min = input<number>(0);
  max = input<number>(100);
  step = input<number>(1);
  unit = input<string>('');
  showTickMarks = input<boolean>(false);

  protected getDefaultValue(): number {
    return 0;
  }
}
