import { describe, expect, it } from 'vitest';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  it('bounds visible notifications and keeps the newest messages', () => {
    const service = new NotificationService();
    for (let index = 0; index < 8; index += 1) {
      service.show(`Message ${index}`);
    }

    expect(service.notifications()).toHaveLength(5);
    expect(service.notifications()[0]?.message).toBe('Message 3');
    expect(service.notifications().at(-1)?.message).toBe('Message 7');
  });
});
