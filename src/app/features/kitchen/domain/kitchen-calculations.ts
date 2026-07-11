import {
  KitchenLoadStatus,
  KitchenStation,
  PreparationTimeEstimate,
  StationAvailability,
} from './kitchen.model';

export function calculateKitchenStatus(loadPercentage: number): KitchenLoadStatus {
  if (loadPercentage >= 85) {
    return 'critical';
  }
  if (loadPercentage >= 60) {
    return 'busy';
  }
  return 'normal';
}

export function calculateStationAvailability(
  loadPercentage: number,
  capacity: number,
): StationAvailability {
  if (capacity <= 0) {
    return 'offline';
  }
  return loadPercentage >= 75 ? 'busy' : 'available';
}

export function calculatePreparationTime(
  baseMinutes: number,
  loadPercentage: number,
  stationLoadPercentage = loadPercentage,
): PreparationTimeEstimate {
  const normalizedLoad = clamp(loadPercentage, 0, 100);
  const normalizedStationLoad = clamp(stationLoadPercentage, 0, 100);
  const loadAdjustmentMinutes = Math.round(
    baseMinutes * (normalizedLoad / 100) * 0.65 +
      baseMinutes * (normalizedStationLoad / 100) * 0.35,
  );
  return {
    baseMinutes,
    loadAdjustmentMinutes,
    estimatedMinutes: baseMinutes + loadAdjustmentMinutes,
  };
}

export function updateStationLoad(
  station: KitchenStation,
  loadDelta: number,
  overallLoad: number,
): KitchenStation {
  const loadPercentage = clamp(station.loadPercentage + loadDelta, 0, 100);
  const activeTickets = Math.max(0, Math.round((loadPercentage / 100) * station.capacity));
  return {
    ...station,
    loadPercentage,
    activeTickets,
    availability: calculateStationAvailability(loadPercentage, station.capacity),
    estimatedPreparationMinutes: calculatePreparationTime(8, overallLoad, loadPercentage)
      .estimatedMinutes,
  };
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}
