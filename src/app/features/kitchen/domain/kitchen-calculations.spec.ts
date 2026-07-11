import { describe, expect, it } from 'vitest';

import {
  calculateKitchenStatus,
  calculatePreparationTime,
  updateStationLoad,
} from './kitchen-calculations';
import { KitchenStation } from './kitchen.model';

describe('kitchen calculations', () => {
  it.each([
    [0, 'normal'],
    [59, 'normal'],
    [60, 'busy'],
    [84, 'busy'],
    [85, 'critical'],
    [100, 'critical'],
  ] as const)('maps %s percent to %s', (load, expected) => {
    expect(calculateKitchenStatus(load)).toBe(expected);
  });

  it('increases preparation time predictably as load rises', () => {
    const normal = calculatePreparationTime(12, 40, 35);
    const critical = calculatePreparationTime(12, 92, 95);
    expect(normal.estimatedMinutes).toBeGreaterThan(normal.baseMinutes);
    expect(critical.estimatedMinutes).toBeGreaterThan(normal.estimatedMinutes);
  });

  it('updates station load, tickets, availability, and estimate immutably', () => {
    const station: KitchenStation = {
      id: 'station-1',
      name: 'grill',
      loadPercentage: 60,
      activeTickets: 6,
      capacity: 10,
      availability: 'available',
      estimatedPreparationMinutes: 12,
    };
    const updated = updateStationLoad(station, 25, 88);
    expect(updated).not.toBe(station);
    expect(updated.loadPercentage).toBe(85);
    expect(updated.activeTickets).toBe(9);
    expect(updated.availability).toBe('busy');
    expect(updated.estimatedPreparationMinutes).toBeGreaterThan(
      station.estimatedPreparationMinutes,
    );
  });
});
