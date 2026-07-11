import { AppError } from '../../../shared/types/app-error';
import { createMockOrder } from '../../orders/data-access/order-mock.generator';
import { AiStreamEvent } from '../domain/ai-recommendation.model';
import { AiRecommendationSimulatorService } from './ai-recommendation-simulator.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('AiRecommendationSimulatorService', () => {
  let simulator: AiRecommendationSimulatorService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T12:00:00Z'));
    simulator = new AiRecommendationSimulatorService();
  });

  afterEach(() => vi.useRealTimers());

  it('streams multiple chunks before completing successfully', async () => {
    const events: AiStreamEvent[] = [];
    simulator
      .generate(createMockOrder(1), { outcome: 'success', slow: false })
      .subscribe((event) => events.push(event));

    expect(events).toEqual([]);
    await vi.advanceTimersByTimeAsync(500);
    expect(events[0]?.kind).toBe('started');
    await vi.advanceTimersByTimeAsync(280);
    expect(events[1]?.kind).toBe('chunk');
    await vi.runAllTimersAsync();

    expect(events.filter((event) => event.kind === 'chunk').length).toBeGreaterThan(1);
    expect(events.at(-1)?.kind).toBe('completed');
  });

  it('returns an empty terminal event', async () => {
    const events: AiStreamEvent[] = [];
    simulator
      .generate(createMockOrder(2), { outcome: 'empty', slow: false })
      .subscribe((event) => events.push(event));
    await vi.runAllTimersAsync();
    expect(events.map((event) => event.kind)).toEqual(['started', 'empty']);
  });

  it('emits a typed failure after analysis starts', async () => {
    const events: AiStreamEvent[] = [];
    const receivedErrors: AppError[] = [];
    simulator.generate(createMockOrder(3), { outcome: 'failure', slow: false }).subscribe({
      next: (event) => events.push(event),
      error: (error: AppError) => {
        receivedErrors.push(error);
      },
    });
    await vi.runAllTimersAsync();
    expect(events.map((event) => event.kind)).toEqual(['started']);
    expect(receivedErrors[0]?.code).toBe('simulation');
    expect(receivedErrors[0]?.retryable).toBe(true);
  });

  it('uses longer intervals when slow streaming is enabled', async () => {
    const events: AiStreamEvent[] = [];
    simulator
      .generate(createMockOrder(4), { outcome: 'success', slow: true })
      .subscribe((event) => events.push(event));
    await vi.advanceTimersByTimeAsync(1_499);
    expect(events).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(events[0]?.kind).toBe('started');
  });
});
