import { Injectable } from '@angular/core';

import { Persistence } from './persistence';

@Injectable({ providedIn: 'root' })
export class LocalStoragePersistenceService implements Persistence {
  read<T>(key: string): T | null {
    const value = localStorage.getItem(key);
    return value === null ? null : (JSON.parse(value) as T);
  }

  write<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }
}
