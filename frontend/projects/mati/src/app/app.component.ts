import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'hostiles-root',
  imports: [RouterOutlet, MatButtonModule, MatIconModule],
  template: `
    <div class="app-container">
      <button
        mat-mini-fab
        color="accent"
        class="global-theme-toggle"
        (click)="toggleTheme()"
        aria-label="Toggle theme"
      >
        <mat-icon>{{
          themeService.isDarkTheme() ? 'light_mode' : 'dark_mode'
        }}</mat-icon>
      </button>
      <router-outlet />
    </div>
  `,
  styles: [
    `
      .app-container {
        width: 100%;
        height: 100%;
        position: relative;
      }

      .global-theme-toggle {
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 1000;
        transition: all 0.3s ease;
      }

      .global-theme-toggle:hover {
        transform: scale(1.1);
      }
    `,
  ],
})
export class AppComponent {
  protected readonly themeService = inject(ThemeService);

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
