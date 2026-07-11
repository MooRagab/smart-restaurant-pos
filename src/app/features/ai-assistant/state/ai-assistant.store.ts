import { Injectable, signal } from '@angular/core';

import { AppError } from '../../../shared/types/app-error';
import { Order } from '../../orders/domain/order.model';
import {
  AiRecommendation,
  AiRecommendationSeverity,
  AiRecommendationState,
  AiRecommendationType,
} from '../domain/ai-recommendation.model';

@Injectable()
export class AiAssistantStore {
  private readonly stateSignal = signal<AiRecommendationState>({ status: 'idle' });

  readonly state = this.stateSignal.asReadonly();

  setIdle(): void {
    this.stateSignal.set({ status: 'idle' });
  }

  setLoading(order: Order, requestId: string): void {
    this.stateSignal.set({ status: 'loading', orderId: order.id, requestId });
  }

  startStreaming(
    order: Order,
    requestId: string,
    type: AiRecommendationType,
    severity: AiRecommendationSeverity,
  ): void {
    this.stateSignal.set({
      status: 'streaming',
      orderId: order.id,
      requestId,
      type,
      severity,
      partialContent: '',
    });
  }

  appendChunk(requestId: string, content: string): void {
    this.stateSignal.update((state) =>
      state.status === 'streaming' && state.requestId === requestId
        ? { ...state, partialContent: state.partialContent + content }
        : state,
    );
  }

  setSuccess(recommendation: AiRecommendation): void {
    this.stateSignal.set({ status: 'success', recommendation });
  }

  setEmpty(order: Order, generatedAt: Date): void {
    this.stateSignal.set({ status: 'empty', orderId: order.id, generatedAt });
  }

  setError(order: Order, error: AppError): void {
    this.stateSignal.set({ status: 'error', orderId: order.id, error });
  }

  setCancelled(order: Order): void {
    this.stateSignal.set({ status: 'cancelled', orderId: order.id });
  }

  markStale(): void {
    this.stateSignal.update((state) =>
      state.status === 'success'
        ? {
            status: 'success',
            recommendation: { ...state.recommendation, stale: true },
          }
        : state,
    );
  }
}
