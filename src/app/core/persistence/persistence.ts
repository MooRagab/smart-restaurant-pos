import { InjectionToken } from '@angular/core';

export type Persistence = {
  read(key: string): unknown | null;
  write(key: string, value: unknown): void;
  remove(key: string): void;
};

export const PERSISTENCE = new InjectionToken<Persistence>('PERSISTENCE');
