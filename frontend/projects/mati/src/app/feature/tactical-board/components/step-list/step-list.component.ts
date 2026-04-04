import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Keyframe } from '../../models/scenario.model';

@Component({
  selector: 'mati-step-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  styleUrl: './step-list.component.scss',
  template: `
    <div class="step-list">
      @for (kf of keyframes(); track kf.time; let i = $index) {
        <div
          class="step-card"
          [class.active]="kf.time === currentTime()"
          (click)="stepSelect.emit(kf.time)"
        >
          <span class="step-number">Step {{ i + 1 }}</span>
          <span class="step-count">{{ entityCount(kf) }} moved</span>
        </div>

        @if (i < keyframes().length - 1) {
          <div class="gap-control">
            <input
              type="number"
              class="gap-input"
              [ngModel]="gap(i)"
              (ngModelChange)="onGapChange(i, $event)"
              min="0.1"
              step="0.1"
            />
            <span class="gap-unit">s</span>
          </div>
        }
      }

      <div class="step-card add-card" (click)="addStep.emit()">
        <span class="add-icon">+</span>
      </div>
    </div>
  `,
})
export class StepListComponent {
  keyframes = input.required<Keyframe[]>();
  currentTime = input.required<number>();
  duration = input.required<number>();

  stepSelect = output<number>();
  addStep = output<void>();
  gapChange = output<{ index: number; newGap: number }>();

  readonly gaps = computed(() => {
    const kfs = this.keyframes();
    const result: number[] = [];
    for (let i = 0; i < kfs.length - 1; i++) {
      result.push(
        parseFloat((kfs[i + 1].time - kfs[i].time).toFixed(1)),
      );
    }
    return result;
  });

  gap(index: number): number {
    return this.gaps()[index] ?? 0;
  }

  entityCount(kf: Keyframe): number {
    return Object.keys(kf.positions).length;
  }

  onGapChange(index: number, newGap: number): void {
    const parsed = parseFloat(String(newGap));
    if (isNaN(parsed) || parsed <= 0) return;
    this.gapChange.emit({ index, newGap: parseFloat(parsed.toFixed(1)) });
  }
}
