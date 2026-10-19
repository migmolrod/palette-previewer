import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { ToolbarModule } from 'primeng/toolbar';
import { filter } from 'rxjs';

/**
 * Fixed top bar + sidebar shell; only the content area scrolls.
 * Sidebar items come from the `menu` route data (bound via `withComponentInputBinding`).
 * Below the `md` breakpoint the sidebar collapses into a drawer.
 */
@Component({
  imports: [ButtonModule, DrawerModule, MenuModule, RouterOutlet, ToolbarModule],
  selector: 'app-admin-layout',
  styleUrl: './admin-layout.scss',
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  readonly menu = input<MenuItem[]>([]);

  protected readonly drawerVisible = signal(false);

  /** Flatten the menu into the sidebar: no own border or rounded corners. */
  protected readonly sidebarMenuTokens = {
    root: { borderColor: 'transparent', borderRadius: '0' },
  };

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.drawerVisible.set(false));
  }
}
