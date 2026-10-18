import { Routes } from '@angular/router';

export default [
  { path: '', pathMatch: 'full', redirectTo: 'accent' },
  {
    path: 'accent',
    title: 'Accent · Palette Previewer',
    loadComponent: () => import('./accent/accent-tool').then((m) => m.AccentTool),
  },
] satisfies Routes;
