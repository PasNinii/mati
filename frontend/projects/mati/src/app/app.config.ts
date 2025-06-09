import { ApplicationConfig } from '@angular/core';

import { routes } from './app.routes';
import { provideCore } from './core/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [provideCore({ routes }), provideAnimationsAsync()],
};
