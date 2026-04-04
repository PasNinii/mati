import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tactical-board' },
  {
    path: 'tactical-board',
    title: 'Tactical Board',
    loadChildren: () =>
      import('./feature/tactical-board/tactical-board.routes'),
  },
  {
    path: 'studio',
    title: 'Studio',
    loadChildren: () =>
      import('./feature/tactical-board/studio.routes'),
  },
  { path: '**', redirectTo: '' },
];
