import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'mati-toolbar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './toolbar.component.scss',
  template: `
    <div class="toolbar">
      <div class="transport-controls">
        <button
          mat-icon-button
          matTooltip="Previous keyframe (Left)"
          (click)="prevKeyframe.emit()"
        >
          <mat-icon>skip_previous</mat-icon>
        </button>

        <button
          mat-icon-button
          matTooltip="Play/Pause (Space)"
          (click)="togglePlay.emit()"
        >
          <mat-icon>{{ isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
        </button>

        <button
          mat-icon-button
          matTooltip="Next keyframe (Right)"
          (click)="nextKeyframe.emit()"
        >
          <mat-icon>skip_next</mat-icon>
        </button>

        <button mat-icon-button matTooltip="Stop" (click)="stop.emit()">
          <mat-icon>stop</mat-icon>
        </button>
      </div>

      <div class="keyframe-controls">
        <button
          mat-stroked-button
          matTooltip="Add keyframe (Ctrl+K)"
          (click)="addKeyframe.emit()"
        >
          <mat-icon>add</mat-icon>
          Keyframe
        </button>

        <button
          mat-stroked-button
          color="warn"
          matTooltip="Delete keyframe (Delete)"
          [disabled]="!canDeleteKeyframe()"
          (click)="deleteKeyframe.emit()"
        >
          <mat-icon>remove</mat-icon>
          Delete
        </button>
      </div>

      <div class="drawing-controls">
        <button
          mat-icon-button
          matTooltip="Arrow tool (A)"
          [class.active]="isDrawingArrow()"
          (click)="toggleArrowMode.emit()"
        >
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>

      <div class="file-controls">
        <button
          mat-stroked-button
          matTooltip="Save (Ctrl+S)"
          (click)="save.emit()"
        >
          <mat-icon>save</mat-icon>
          Save
        </button>

        <button mat-stroked-button matTooltip="Load" (click)="load.emit()">
          <mat-icon>upload_file</mat-icon>
          Load
        </button>

        <button
          mat-stroked-button
          matTooltip="New scenario"
          (click)="newScenario.emit()"
        >
          <mat-icon>note_add</mat-icon>
          New
        </button>
      </div>
    </div>
  `,
})
export class ToolbarComponent {
  isPlaying = input.required<boolean>();
  canDeleteKeyframe = input.required<boolean>();
  isDrawingArrow = input.required<boolean>();

  togglePlay = output<void>();
  stop = output<void>();
  prevKeyframe = output<void>();
  nextKeyframe = output<void>();
  addKeyframe = output<void>();
  deleteKeyframe = output<void>();
  save = output<void>();
  load = output<void>();
  newScenario = output<void>();
  toggleArrowMode = output<void>();
}
