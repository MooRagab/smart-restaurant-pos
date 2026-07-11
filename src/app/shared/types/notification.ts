export type NotificationTone = 'info' | 'success' | 'warning' | 'error';

export type AppNotification = Readonly<{
  id: string;
  message: string;
  tone: NotificationTone;
  createdAt: Date;
}>;
