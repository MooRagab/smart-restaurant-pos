export type KitchenLoadStatus = 'normal' | 'busy' | 'critical';
export type KitchenStationName = 'grill' | 'fryer' | 'drinks' | 'desserts' | 'packaging';
export type StationAvailability = 'available' | 'busy' | 'offline';

export type KitchenStation = Readonly<{
  id: string;
  name: KitchenStationName;
  loadPercentage: number;
  activeTickets: number;
  capacity: number;
  availability: StationAvailability;
  estimatedPreparationMinutes: number;
}>;

export type WorkloadHistoryPoint = Readonly<{
  timestamp: Date;
  loadPercentage: number;
  status: KitchenLoadStatus;
}>;

export type PreparationTimeEstimate = Readonly<{
  baseMinutes: number;
  loadAdjustmentMinutes: number;
  estimatedMinutes: number;
}>;

export type KitchenLoad = Readonly<{
  overallLoadPercentage: number;
  status: KitchenLoadStatus;
  activeOrders: number;
  averagePreparationMinutes: number;
  delayedOrders: number;
  availableStations: number;
  busyStations: number;
  stations: readonly KitchenStation[];
  history: readonly WorkloadHistoryPoint[];
  revision: number;
  updatedAt: Date;
}>;

export type KitchenLoadChangedEvent = Readonly<{
  type: 'kitchen.load-changed';
  load: KitchenLoad;
  previousLoad: KitchenLoad;
}>;

export type KitchenSimulationTick = Readonly<{
  sequence: number;
  overallDelta: number;
  stationIndex: number;
  stationDelta: number;
}>;

export const KITCHEN_STATION_NAMES: readonly KitchenStationName[] = [
  'grill',
  'fryer',
  'drinks',
  'desserts',
  'packaging',
];
