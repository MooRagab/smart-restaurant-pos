import { calculateKitchenStatus, calculatePreparationTime } from '../domain/kitchen-calculations';
import { KitchenLoad, KitchenStation, KitchenStationName } from '../domain/kitchen.model';

const STATION_FIXTURES: readonly Readonly<{
  name: KitchenStationName;
  load: number;
  capacity: number;
}>[] = [
  { name: 'grill', load: 68, capacity: 12 },
  { name: 'fryer', load: 74, capacity: 10 },
  { name: 'drinks', load: 42, capacity: 14 },
  { name: 'desserts', load: 36, capacity: 8 },
  { name: 'packaging', load: 59, capacity: 16 },
];

export function createInitialKitchenLoad(now = new Date()): KitchenLoad {
  const overallLoadPercentage = 62;
  const stations: readonly KitchenStation[] = STATION_FIXTURES.map((fixture, index) => ({
    id: `station-${index + 1}`,
    name: fixture.name,
    loadPercentage: fixture.load,
    activeTickets: Math.round((fixture.load / 100) * fixture.capacity),
    capacity: fixture.capacity,
    availability: fixture.load >= 75 ? 'busy' : 'available',
    estimatedPreparationMinutes: calculatePreparationTime(8, overallLoadPercentage, fixture.load)
      .estimatedMinutes,
  }));
  const status = calculateKitchenStatus(overallLoadPercentage);
  return {
    overallLoadPercentage,
    status,
    activeOrders: 32,
    averagePreparationMinutes: calculatePreparationTime(12, overallLoadPercentage).estimatedMinutes,
    delayedOrders: 4,
    availableStations: stations.filter((station) => station.availability === 'available').length,
    busyStations: stations.filter((station) => station.availability === 'busy').length,
    stations,
    history: [
      { timestamp: new Date(now.getTime() - 20 * 60_000), loadPercentage: 48, status: 'normal' },
      { timestamp: new Date(now.getTime() - 15 * 60_000), loadPercentage: 54, status: 'normal' },
      { timestamp: new Date(now.getTime() - 10 * 60_000), loadPercentage: 58, status: 'normal' },
      { timestamp: new Date(now.getTime() - 5 * 60_000), loadPercentage: 61, status: 'busy' },
      { timestamp: now, loadPercentage: overallLoadPercentage, status },
    ],
    revision: 1,
    updatedAt: now,
  };
}
