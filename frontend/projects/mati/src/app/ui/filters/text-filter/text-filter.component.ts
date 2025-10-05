import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { BaseFilterComponent } from '../base-filter.component';

@Component({
  selector: 'mati-text-filter',
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
      @if (filter().config().label) {
        <mat-label>{{ filter().config().label }}</mat-label>
      }
      <input
        matInput
        type="text"
        [ngModel]="filter().value()"
        (ngModelChange)="onValueChange($event)"
        [placeholder]="filter().config().placeholder || ''"
      />
      @if (filter().config().clearable !== false && filter().value()) {
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
export class TextFilterComponent extends BaseFilterComponent<string | null> {}
