import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { PRIMEUI_LICENSE } from './primeui-license';

/** Aura with its light-scheme colors darkened where they miss WCAG AA (dark is unchanged). */
const AppPreset = definePreset(Aura, {
  semantic: {
    // White on emerald 500 is 2.5:1; on 700, 5.5:1.
    primary: {
      color: 'light-dark({primary.700}, {primary.400})',
      hoverColor: 'light-dark({primary.800}, {primary.300})',
      activeColor: 'light-dark({primary.900}, {primary.200})',
    },
  },
  components: {
    // Unselected options: surface 500 on surface 100 is 4.3:1.
    togglebutton: {
      root: { color: 'light-dark({surface.600}, {surface.400})' },
      icon: { color: 'light-dark({surface.600}, {surface.400})' },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    providePrimeNG({
      license: PRIMEUI_LICENSE,
      theme: { preset: AppPreset },
    }),
  ],
};
