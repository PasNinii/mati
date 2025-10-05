import { Injectable, inject } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

export interface ShortcutAction {
  filterId?: string;
  action: 'toggle' | 'increment' | 'decrement';
  customHandler?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class KeyboardShortcutService {
  private shortcuts = new Map<string, ShortcutAction>();
  private destroy$ = new Subject<void>();
  private isListening = false;
  private boundHandleKeyDown: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    this.startListening();
  }

  /**
   * Register a keyboard shortcut
   * @param shortcut - Keyboard shortcut string (e.g., 'ctrl+b', 'ctrl+shift+s')
   * @param action - Action configuration
   */
  register(shortcut: string, action: ShortcutAction): void {
    const normalizedShortcut = this.normalizeShortcut(shortcut);
    this.shortcuts.set(normalizedShortcut, action);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(shortcut: string): void {
    const normalizedShortcut = this.normalizeShortcut(shortcut);
    this.shortcuts.delete(normalizedShortcut);
  }

  /**
   * Clear all registered shortcuts
   */
  clearAll(): void {
    this.shortcuts.clear();
  }

  /**
   * Get action for a shortcut
   */
  getAction(shortcut: string): ShortcutAction | undefined {
    const normalizedShortcut = this.normalizeShortcut(shortcut);
    return this.shortcuts.get(normalizedShortcut);
  }

  /**
   * Start listening for keyboard events
   */
  private startListening(): void {
    if (this.isListening) return;

    // Use capture phase to intercept events before they reach components
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.boundHandleKeyDown, {
      capture: true,
    });

    this.isListening = true;
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Check if we should handle this event (not in input fields, etc.)
    if (!this.shouldHandleEvent(event)) {
      return;
    }

    const shortcut = this.eventToShortcut(event);
    const action = this.shortcuts.get(shortcut);

    if (action) {
      // Prevent default browser behavior
      event.preventDefault();
      event.stopPropagation();

      if (action.customHandler) {
        action.customHandler();
      } else {
        // Emit event that can be handled by subscribers
        this.shortcutTriggered$.next({ shortcut, action });
      }
    }
  }

  /**
   * Stop listening for keyboard events
   */
  stopListening(): void {
    if (this.boundHandleKeyDown) {
      document.removeEventListener('keydown', this.boundHandleKeyDown, {
        capture: true,
      });
      this.boundHandleKeyDown = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.isListening = false;
  }

  /**
   * Subject to emit shortcut triggers
   */
  private shortcutTriggered$ = new Subject<{
    shortcut: string;
    action: ShortcutAction;
  }>();

  /**
   * Observable for shortcut triggers
   */
  get shortcutTriggered() {
    return this.shortcutTriggered$.asObservable();
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
