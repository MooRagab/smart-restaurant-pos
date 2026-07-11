import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { NotificationService } from '../../../core/notifications/notification.service';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  private readonly notificationService = inject(NotificationService);

  protected readonly notifications = this.notificationService.notifications;

  protected dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }
}
