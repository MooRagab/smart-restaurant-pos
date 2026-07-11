import { InjectionToken } from '@angular/core';

export type Persistence = {
  read<T>(key: string): T | null;
  write<T>(key: string, value: T): void;
  remove(key: string): void;
};

export const PERSISTENCE = new InjectionToken<Persistence>('PERSISTENCE');
