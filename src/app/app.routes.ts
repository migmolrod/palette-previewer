import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tools' },
  { path: 'tools', loadChildren: () => import('./tools/tools.routes') },
  { path: '**', redirectTo: 'tools' },
];
