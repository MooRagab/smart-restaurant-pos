import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { BrowserLoggerService } from './core/error-handling/browser-logger.service';
import { LOGGER } from './core/error-handling/logger';
import { LocalStoragePersistenceService } from './core/persistence/local-storage-persistence.service';
import { PERSISTENCE } from './core/persistence/persistence';
import { OFFLINE_OPERATION_EXECUTOR } from './features/offline-queue/data-access/offline-operation-executor';
import { SimulatedOfflineOperationExecutorService } from './features/offline-queue/data-access/simulated-offline-operation-executor.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    { provide: LOGGER, useExisting: BrowserLoggerService },
    { provide: PERSISTENCE, useExisting: LocalStoragePersistenceService },
    { provide: OFFLINE_OPERATION_EXECUTOR, useExisting: SimulatedOfflineOperationExecutorService },
  ],
};
