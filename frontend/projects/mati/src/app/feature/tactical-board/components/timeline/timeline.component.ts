import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Keyframe } from '../../models/scenario.model';

@Component({
  selector: 'mati-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './timeline.component.scss',
  template: `
    <div class="timeline">
      <div class="time-display">
        {{ formatTime(currentTime()) }} / {{ formatTime(duration()) }}
      </div>

      <div class="track" #track (mousedown)="onTrackClick($event)">
        <div class="progress" [style.width.%]="progressPercent()"></div>

        <div class="scrubber" [style.left.%]="progressPercent()"></div>

        @for (kf of keyframes(); track kf.time) {
          <div
            class="keyframe-marker"
            [class.active]="kf.time === currentTime()"
            [style.left.%]="(kf.time / duration()) * 100"
            (mousedown)="onKeyframeClick($event, kf.time)"
            [title]="formatTime(kf.time)"
          ></div>
        }
      </div>
    </div>
  `,
})
export class TimelineComponent {
  keyframes = input.required<Keyframe[]>();
  currentTime = input.required<number>();
  duration = input.required<number>();

  timeChange = output<number>();
  keyframeSelect = output<number>();

  private readonly trackRef = viewChild<ElementRef<HTMLDivElement>>('track');

  readonly progressPercent = computed(() => {
    const d = this.duration();
    return d > 0 ? (this.currentTime() / d) * 100 : 0;
  });

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  }

  onTrackClick(event: MouseEvent): void {
    const track = this.trackRef()?.nativeElement;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width),
    );
    const time = parseFloat((percent * this.duration()).toFixed(1));
    this.timeChange.emit(time);
  }

  onKeyframeClick(event: MouseEvent, time: number): void {
    event.stopPropagation();
    this.keyframeSelect.emit(time);
  }
}
