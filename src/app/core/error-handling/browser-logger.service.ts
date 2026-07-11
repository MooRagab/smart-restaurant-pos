import { Injectable } from '@angular/core';

import { AppError } from '../../shared/types/app-error';
import { Logger } from './logger';

@Injectable({ providedIn: 'root' })
export class BrowserLoggerService implements Logger {
  info(message: string, context?: Readonly<Record<string, unknown>>): void {
    void message;
    void context;
  }

  error(error: AppError, context?: Readonly<Record<string, unknown>>): void {
    void error;
    void context;
  }
}
