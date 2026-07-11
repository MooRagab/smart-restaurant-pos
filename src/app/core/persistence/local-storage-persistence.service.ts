import { Injectable } from '@angular/core';

import { Persistence } from './persistence';

@Injectable({ providedIn: 'root' })
export class LocalStoragePersistenceService implements Persistence {
  read(key: string): unknown | null {
    const value = localStorage.getItem(key);
    return value === null ? null : JSON.parse(value);
  }

  write(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }
}
