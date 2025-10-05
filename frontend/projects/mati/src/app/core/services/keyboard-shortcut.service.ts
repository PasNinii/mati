import { Injectable } from '@angular/core';

/**
 * Simplified keyboard shortcut service
 * Acts as a thin coordinator for keyboard shortcuts
 */
@Injectable({
  providedIn: 'root',
})
export class KeyboardShortcutService {
  private shortcuts = new Map<string, () => void>();
  private boundHandleKeyDown: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    this.startListening();
  }

  /**
   * Register a keyboard shortcut with a handler
   * Returns an unregister function for cleanup
   */
  register(shortcut: string, handler: () => void): () => void {
    const normalized = this.normalizeShortcut(shortcut);
    this.shortcuts.set(normalized, handler);

    // Return cleanup function
    return () => this.shortcuts.delete(normalized);
  }

  /**
   * Start listening for keyboard events
   */
  private startListening(): void {
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.boundHandleKeyDown, {
      capture: true,
    });
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.shouldHandleEvent(event)) {
      return;
    }

    const shortcut = this.eventToShortcut(event);
    const handler = this.shortcuts.get(shortcut);

    if (handler) {
      event.preventDefault();
      event.stopPropagation();
      handler();
    }
  }

  /**
   * Check if event should be handled (not in input fields, etc.)
   */
  private shouldHandleEvent(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();

    // Don't handle shortcuts when typing in text input fields, textareas, or select elements
    // But DO handle them for checkboxes, buttons, and other interactive elements
    if (
      (tagName === 'input' &&
        (target as HTMLInputElement).type !== 'checkbox' &&
        (target as HTMLInputElement).type !== 'button' &&
        (target as HTMLInputElement).type !== 'radio') ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      target.isContentEditable
    ) {
      return false;
    }

    return true;
  }

  /**
   * Convert keyboard event to shortcut string
   */
  private eventToShortcut(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');

    const key = event.key.toLowerCase();
    parts.push(key);

    return parts.join('+');
  }

  /**
   * Normalize shortcut string for consistent comparison
   */
  private normalizeShortcut(shortcut: string): string {
    const parts = shortcut
      .toLowerCase()
      .split('+')
      .map((p) => p.trim());

    // Sort modifiers in consistent order
    const modifiers = parts
      .filter((p) => ['ctrl', 'alt', 'shift', 'meta'].includes(p))
      .sort();
    const keys = parts.filter(
      (p) => !['ctrl', 'alt', 'shift', 'meta'].includes(p),
    );

    return [...modifiers, ...keys].join('+');
  }
}
