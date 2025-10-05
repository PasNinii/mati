import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { BaseFilterComponent } from '../base-filter.component';

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
export class NumberFilterComponent extends BaseFilterComponent<number | null> {
  // Additional inputs specific to number filter
  placeholder = input<string>('');
  min = input<number | undefined>(undefined);
  max = input<number | undefined>(undefined);
  clearable = input<boolean>(true);

  protected getDefaultValue(): number | null {
    return null;
  }
}
