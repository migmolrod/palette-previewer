import { MenuItem } from 'primeng/api';

export const TOOLS_MENU: MenuItem[] = [
  {
    label: 'Generators',
    items: [{ label: 'Accent', icon: 'pi pi-palette', routerLink: '/tools/accent' }],
  },
  {
    label: 'Apply',
    items: [{ label: 'Colorize image', icon: 'pi pi-image', routerLink: '/tools/colorize' }],
  },
];
