import { Routes } from '@angular/router';
import { TOOLS_MENU } from './tools/tools.menu';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tools' },
  {
    path: 'tools',
    loadComponent: () => import('./layout/admin-layout/admin-layout').then((m) => m.AdminLayout),
    data: { menu: TOOLS_MENU },
    loadChildren: () => import('./tools/tools.routes'),
  },
  { path: '**', redirectTo: 'tools' },
];
