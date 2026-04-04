import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { FilterComponent } from '../../pattern/filter';
import { KeyboardShortcutService } from '../../core/services/keyboard-shortcut.service';
import { TacticalBoardStateService } from './services';

@Component({
  selector: 'mati-tactical-board',
  imports: [MatSidenavModule, MatButtonModule, MatIconModule, FilterComponent],
  providers: [TacticalBoardStateService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './tactical-board.component.scss',
  template: `
    <mat-drawer-container class="drawer-container" autosize>
      <mat-drawer-content>
        <div class="tactical-board-container">
          <button
            mat-fab
            color="primary"
            class="toggle-drawer-btn"
            (click)="toggleDrawer()"
            [title]="'Toggle settings (Ctrl+D)'"
            aria-label="Toggle settings"
          >
            <mat-icon>{{ drawer.opened ? 'close' : 'settings' }}</mat-icon>
          </button>

          <div #konvaContainer class="konva-container"></div>
        </div>
      </mat-drawer-content>

      <mat-drawer #drawer mode="over" position="end" class="settings-drawer">
        <div class="drawer-content">
          <h2 class="drawer-title">Board Configuration</h2>

          <mati-filter
            [configPath]="'assets/filters/tactical-board-filters.json'"
            [showGroupNames]="true"
            [showClearAll]="false"
            [showShare]="true"
          />
        </div>
      </mat-drawer>
    </mat-drawer-container>
  `,
})
export class TacticalBoardComponent {
  private readonly keyboardShortcutService = inject(KeyboardShortcutService);
  protected readonly stateService = inject(TacticalBoardStateService);

  private readonly konvaContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('konvaContainer');
  private readonly drawerRef = viewChild.required<MatDrawer>('drawer');

  protected get drawer(): MatDrawer {
    return this.drawerRef();
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    const unregister = this.keyboardShortcutService.register('ctrl+d', () => {
      this.toggleDrawer();
    });
    destroyRef.onDestroy(unregister);

    afterNextRender(() => {
      this.stateService.setKonvaContainer(this.konvaContainer());
    });
  }

  protected toggleDrawer(): void {
    this.drawer.toggle();
  }
}
