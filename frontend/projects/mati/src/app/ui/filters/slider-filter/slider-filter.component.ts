import { Component, ChangeDetectionStrategy } from '@angular/core';
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
      @if (filter().config().label) {
        <label class="slider-label"
          >{{ filter().config().label }}: {{ filter().value() }}</label
        >
      }
      <mat-slider
        [min]="filter().config().min ?? 0"
        [max]="filter().config().max ?? 100"
        [step]="filter().config().step ?? 1"
        [discrete]="true"
        [showTickMarks]="false"
        color="primary"
      >
        <input
          matSliderThumb
          [ngModel]="filter().value()"
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
export class SliderFilterComponent extends BaseFilterComponent<number> {}
