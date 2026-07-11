import { describe, expect, it } from 'vitest';

import { KitchenStore } from './kitchen.store';

describe('KitchenStore', () => {
  it('applies deterministic station and overall load updates', () => {
    const store = new KitchenStore();
    const before = store.load();
    const after = store.applySimulationTick({
      sequence: 1,
      overallDelta: 10,
      stationIndex: 0,
      stationDelta: 20,
    });
    expect(after.overallLoadPercentage).toBe(before.overallLoadPercentage + 10);
    expect(after.stations[0]?.loadPercentage).toBe(before.stations[0]!.loadPercentage + 20);
    expect(after.stations[1]?.loadPercentage).toBe(before.stations[1]!.loadPercentage + 3);
    expect(after.history.length).toBe(before.history.length + 1);
  });

  it('sets each requested status to a representative load', () => {
    const store = new KitchenStore();
    expect(store.setStatus('normal').status).toBe('normal');
    expect(store.setStatus('busy').status).toBe('busy');
    expect(store.setStatus('critical').status).toBe('critical');
  });

  it('resets history while preserving the current reading', () => {
    const store = new KitchenStore();
    store.increaseLoad();
    const reset = store.resetHistory();
    expect(reset.history).toHaveLength(1);
    expect(reset.history[0]?.loadPercentage).toBe(reset.overallLoadPercentage);
  });
});
