import { computed, Injectable, signal } from '@angular/core';

@Injectable()
export class SelectionService {
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly count = computed(() => this.selectedIds().size);

  select(id: string): void {
    this.selectedIds.set(new Set([id]));
  }

  toggleSelect(id: string): void {
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }
}
