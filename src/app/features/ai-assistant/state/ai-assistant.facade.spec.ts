import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockOrder } from '../../orders/data-access/order-mock.generator';
import { Order } from '../../orders/domain/order.model';
import { AiRecommendationSimulatorService } from '../data-access/ai-recommendation-simulator.service';
import { AiSimulationControlsService } from '../data-access/ai-simulation-controls.service';
import { AiAssistantFacade } from './ai-assistant.facade';
import { AiAssistantStore } from './ai-assistant.store';

function testOrder(index: number, revision = 1): Order {
  return {
    ...createMockOrder(index, new Date('2026-07-11T12:00:00Z')),
    id: `test-order-${index}`,
    revision,
    isDelayed: false,
  };
}

describe('AiAssistantFacade', () => {
  let facade: AiAssistantFacade;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T12:00:00Z'));
    TestBed.configureTestingModule({
      providers: [
        AiAssistantStore,
        AiAssistantFacade,
        AiRecommendationSimulatorService,
        AiSimulationControlsService,
      ],
    });
    facade = TestBed.inject(AiAssistantFacade);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('progresses from loading through streaming to success', async () => {
    facade.selectOrder(testOrder(1));
    facade.setSimulationOutcome('success');
    facade.generate();
    expect(facade.state().status).toBe('loading');

    await vi.advanceTimersByTimeAsync(500);
    expect(facade.state().status).toBe('streaming');
    await vi.runAllTimersAsync();
    const state = facade.state();
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.recommendation.content.length).toBeGreaterThan(20);
      expect(state.recommendation.generatedAt).toEqual(new Date('2026-07-11T12:00:00Z'));
      expect(state.recommendation.stale).toBe(false);
    }
  });

  it('cancels an active stream explicitly', async () => {
    facade.selectOrder(testOrder(2));
    facade.setSimulationOutcome('success');
    facade.generate();
    await vi.advanceTimersByTimeAsync(800);
    facade.cancel();
    expect(facade.state().status).toBe('cancelled');
    await vi.runAllTimersAsync();
    expect(facade.state().status).toBe('cancelled');
  });

  it('retries after failure and can complete successfully', async () => {
    facade.selectOrder(testOrder(3));
    facade.setSimulationOutcome('failure');
    facade.generate();
    await vi.runAllTimersAsync();
    expect(facade.state().status).toBe('error');

    facade.setSimulationOutcome('success');
    facade.retry();
    await vi.runAllTimersAsync();
    expect(facade.state().status).toBe('success');
  });

  it('cancels on selection change and prevents the old result from overwriting state', async () => {
    const firstOrder = testOrder(4);
    const secondOrder = testOrder(5);
    facade.selectOrder(firstOrder);
    facade.setSimulationOutcome('success');
    facade.generate();
    await vi.advanceTimersByTimeAsync(800);
    expect(facade.state().status).toBe('streaming');

    facade.selectOrder(secondOrder);
    expect(facade.state().status).toBe('idle');
    await vi.runAllTimersAsync();
    expect(facade.state()).toEqual({ status: 'idle' });
  });

  it('marks a completed recommendation stale when the selected order revision changes', async () => {
    const order = testOrder(6, 1);
    facade.selectOrder(order);
    facade.setSimulationOutcome('success');
    facade.generate();
    await vi.runAllTimersAsync();

    facade.selectOrder({ ...order, revision: 2 });
    const state = facade.state();
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.recommendation.stale).toBe(true);
    }
  });

  it('resets recommendation and development controls', () => {
    facade.selectOrder(testOrder(7));
    facade.setSimulationOutcome('empty');
    facade.setSlowStreaming(true);
    facade.generate();
    facade.reset();
    expect(facade.state()).toEqual({ status: 'idle' });
    expect(facade.simulationOutcome()).toBe('auto');
    expect(facade.slowStreaming()).toBe(false);
  });
});
