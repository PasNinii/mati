import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    title: 'Home',
    loadChildren: () => import('./feature/home/home.routes'),
  },
  {
    path: 'store-test',
    title: 'Store Test',
    loadChildren: () => import('./feature/store-test/store-test.routes'),
  },
  { path: '**', redirectTo: '' },
];
