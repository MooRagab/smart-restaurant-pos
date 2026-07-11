import { Injectable, signal } from '@angular/core';

import { AppNotification, NotificationTone } from '../../shared/types/notification';
import { IdGenerator } from '../../shared/utilities/id-generator';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private static readonly MAX_VISIBLE_NOTIFICATIONS = 5;
  private readonly notificationsSignal = signal<readonly AppNotification[]>([]);
  private readonly idGenerator = new IdGenerator();

  readonly notifications = this.notificationsSignal.asReadonly();

  show(message: string, tone: NotificationTone = 'info'): string {
    const id = this.idGenerator.next('notification');
    const notification: AppNotification = { id, message, tone, createdAt: new Date() };
    this.notificationsSignal.update((current) =>
      [...current, notification].slice(-NotificationService.MAX_VISIBLE_NOTIFICATIONS),
    );
    return id;
  }

  dismiss(id: string): void {
    this.notificationsSignal.update((current) => current.filter((item) => item.id !== id));
  }
}
