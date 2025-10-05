import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Signal to track current theme state
  readonly isDarkTheme = signal<boolean>(false);

  constructor() {
    // Load saved theme preference on initialization
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;

      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        this.isDarkTheme.set(true);
      }
    }

    // Effect to apply theme changes to DOM
    effect(() => {
      if (this.isBrowser) {
        const isDark = this.isDarkTheme();
        const htmlElement = document.documentElement;

        if (isDark) {
          htmlElement.classList.add('dark-theme');
          localStorage.setItem('theme', 'dark');
        } else {
          htmlElement.classList.remove('dark-theme');
          localStorage.setItem('theme', 'light');
        }
      }
    });
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    this.isDarkTheme.update((current) => !current);
  }

  /**
   * Set theme explicitly
   */
  setTheme(isDark: boolean): void {
    this.isDarkTheme.set(isDark);
  }

  /**
   * Get current theme state
   */
  getTheme(): boolean {
    return this.isDarkTheme();
  }
}
