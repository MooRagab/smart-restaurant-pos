import { InjectionToken } from '@angular/core';

import { AppError } from '../../shared/types/app-error';

export type Logger = {
  info(message: string, context?: Readonly<Record<string, unknown>>): void;
  error(error: AppError, context?: Readonly<Record<string, unknown>>): void;
};

export const LOGGER = new InjectionToken<Logger>('LOGGER');
