import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { BaseFilterComponent } from '../base-filter.component';

@Component({
  selector: 'mati-number-filter',
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
      @if (filter().config().label) {
        <mat-label>{{ filter().config().label }}</mat-label>
      }
      <input
        matInput
        type="number"
        [ngModel]="filter().value()"
        (ngModelChange)="onValueChange($event)"
        [placeholder]="filter().config().placeholder || ''"
        [attr.min]="filter().config().min"
        [attr.max]="filter().config().max"
      />
      @if (filter().config().clearable !== false && filter().value() !== null) {
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
export class NumberFilterComponent extends BaseFilterComponent<number | null> {}
