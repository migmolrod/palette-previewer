import { Routes } from '@angular/router';

export default [
  { path: '', pathMatch: 'full', redirectTo: 'accent' },
  {
    path: 'accent',
    title: 'Accent · Palette Previewer',
    loadComponent: () => import('./accent/accent-tool').then((m) => m.AccentTool),
  },
  {
    path: 'colorize',
    title: 'Colorize image · Palette Previewer',
    loadComponent: () => import('./colorize/colorize-tool').then((m) => m.ColorizeTool),
  },
] satisfies Routes;
