import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { BrowserLoggerService } from './core/error-handling/browser-logger.service';
import { LOGGER } from './core/error-handling/logger';
import { LocalStoragePersistenceService } from './core/persistence/local-storage-persistence.service';
import { PERSISTENCE } from './core/persistence/persistence';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    { provide: LOGGER, useExisting: BrowserLoggerService },
    { provide: PERSISTENCE, useExisting: LocalStoragePersistenceService },
  ],
};
