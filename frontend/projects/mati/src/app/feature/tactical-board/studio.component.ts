import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { StepListComponent } from './components/step-list/step-list.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { StudioStateService } from './services/studio-state.service';
import { KonvaStageService } from './services/konva-stage.service';
import { EntityManager } from './services/entity-manager.service';
import { SelectionService } from './services/selection.service';
import { PlaybackService } from './services/playback.service';
import { OverlayService } from './services/overlay.service';
import { AnnotationService } from './services/annotation.service';
import { KeyboardShortcutService } from '../../core/services/keyboard-shortcut.service';

@Component({
  selector: 'mati-studio',
  imports: [
    StepListComponent,
    ToolbarComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  providers: [
    StudioStateService,
    KonvaStageService,
    EntityManager,
    SelectionService,
    PlaybackService,
    OverlayService,
    AnnotationService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './studio.component.scss',
  template: `
    <div class="studio-layout">
      <div class="studio-header">
        <mat-form-field appearance="outline" class="scenario-name">
          <mat-label>Scenario</mat-label>
          <input
            matInput
            [value]="state.scenarioName()"
            (input)="onNameChange($event)"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="duration-field">
          <mat-label>Duration (s)</mat-label>
          <input
            matInput
            type="number"
            [value]="state.duration()"
            (input)="onDurationChange($event)"
            min="1"
            max="300"
          />
        </mat-form-field>
      </div>

      <div class="canvas-area">
        <div #konvaContainer class="konva-container"></div>
      </div>

      <div class="studio-controls">
        <mati-toolbar
          [isPlaying]="state.playbackService.isPlaying()"
          [canDeleteKeyframe]="canDeleteKeyframe()"
          [isDrawingArrow]="state.annotationService.drawingMode() === 'arrow'"
          (togglePlay)="state.togglePlayback()"
          (stop)="state.playbackService.stop()"
          (prevKeyframe)="state.prevKeyframe()"
          (nextKeyframe)="state.nextKeyframe()"
          (addKeyframe)="state.addKeyframe()"
          (deleteKeyframe)="onDeleteKeyframe()"
          (save)="state.save()"
          (load)="onLoad()"
          (newScenario)="state.newScenario()"
          (toggleArrowMode)="state.annotationService.toggleArrowMode()"
        />

        <mati-step-list
          [keyframes]="state.sortedKeyframes()"
          [currentTime]="state.currentTime()"
          [duration]="state.duration()"
          (stepSelect)="state.seekTo($event)"
          (addStep)="state.addStep()"
          (gapChange)="state.updateStepGap($event.index, $event.newGap)"
        />
      </div>
    </div>
  `,
})
export class StudioComponent {
  protected readonly state = inject(StudioStateService);
  private readonly keyboardShortcutService = inject(KeyboardShortcutService);

  private readonly konvaContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('konvaContainer');

  protected readonly canDeleteKeyframe = computed(() => {
    const idx = this.state.currentKeyframeIndex();
    return idx > 0;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.state.initStudio(this.konvaContainer());
    });

    const shortcuts = [
      this.keyboardShortcutService.register(' ', () =>
        this.state.togglePlayback(),
      ),
      this.keyboardShortcutService.register('arrowleft', () =>
        this.state.prevKeyframe(),
      ),
      this.keyboardShortcutService.register('arrowright', () =>
        this.state.nextKeyframe(),
      ),
      this.keyboardShortcutService.register('ctrl+s', () => this.state.save()),
      this.keyboardShortcutService.register('ctrl+k', () =>
        this.state.addKeyframe(),
      ),
      this.keyboardShortcutService.register('escape', () => {
        if (this.state.playbackService.isPlaying()) {
          this.state.playbackService.stop();
        } else {
          this.state.selectionService.clearSelection();
        }
      }),
      this.keyboardShortcutService.register('delete', () =>
        this.onDeleteKeyframe(),
      ),
      this.keyboardShortcutService.register('a', () =>
        this.state.annotationService.toggleArrowMode(),
      ),
    ];

    destroyRef.onDestroy(() => shortcuts.forEach((unsub) => unsub()));
  }

  protected onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.state.scenarioName.set(value);
  }

  protected onDurationChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(value) && value > 0) {
      this.state.duration.set(value);
    }
  }

  protected onDeleteKeyframe(): void {
    if (this.canDeleteKeyframe()) {
      this.state.deleteKeyframe(this.state.currentTime());
    }
  }

  protected async onLoad(): Promise<void> {
    try {
      await this.state.load();
    } catch (e) {
      console.error('Failed to load scenario:', e);
    }
  }
}
