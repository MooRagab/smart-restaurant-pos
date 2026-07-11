import { DestroyRef, Injectable, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { AppError } from '../../../shared/types/app-error';
import { IdGenerator } from '../../../shared/utilities/id-generator';
import { Order } from '../../orders/domain/order.model';
import { AiRecommendationSimulatorService } from '../data-access/ai-recommendation-simulator.service';
import { AiSimulationControlsService } from '../data-access/ai-simulation-controls.service';
import {
  AiRecommendationSeverity,
  AiRecommendationType,
  AiSimulationOutcome,
  AiStreamEvent,
} from '../domain/ai-recommendation.model';
import { AiAssistantStore } from './ai-assistant.store';

type ActiveRequest = {
  readonly id: string;
  readonly order: Order;
  type: AiRecommendationType | null;
  severity: AiRecommendationSeverity | null;
};

@Injectable()
export class AiAssistantFacade {
  private readonly store = inject(AiAssistantStore);
  private readonly simulator = inject(AiRecommendationSimulatorService);
  private readonly controls = inject(AiSimulationControlsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly idGenerator = new IdGenerator();
  private selectedOrder: Order | null = null;
  private activeRequest: ActiveRequest | null = null;
  private streamSubscription: Subscription | null = null;

  readonly state = this.store.state;
  readonly simulationOutcome = this.controls.outcome;
  readonly slowStreaming = this.controls.slow;

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelStream(false));
  }

  selectOrder(order: Order | null): void {
    if (order?.id === this.selectedOrder?.id) {
      const state = this.state();
      if (
        order !== null &&
        state.status === 'success' &&
        state.recommendation.orderRevision !== order.revision
      ) {
        this.store.markStale();
      }
      this.selectedOrder = order;
      return;
    }

    this.cancelStream(false);
    this.selectedOrder = order;
    this.store.setIdle();
  }

  generate(): void {
    const order = this.selectedOrder;
    if (order === null) {
      return;
    }

    this.cancelStream(false);
    const request: ActiveRequest = {
      id: this.idGenerator.next('ai-request'),
      order,
      type: null,
      severity: null,
    };
    this.activeRequest = request;
    this.store.setLoading(order, request.id);
    this.streamSubscription = this.simulator.generate(order, this.controls.options()).subscribe({
      next: (event) => this.handleEvent(request, event),
      error: (error: AppError) => {
        if (!this.isActive(request)) {
          return;
        }
        this.activeRequest = null;
        this.streamSubscription = null;
        this.store.setError(order, error);
      },
      complete: () => {
        if (this.isActive(request)) {
          this.activeRequest = null;
          this.streamSubscription = null;
        }
      },
    });
  }

  retry(): void {
    this.generate();
  }

  cancel(): void {
    this.cancelStream(true);
  }

  reset(): void {
    this.cancelStream(false);
    this.controls.reset();
    this.store.setIdle();
  }

  setSimulationOutcome(outcome: AiSimulationOutcome): void {
    this.controls.setOutcome(outcome);
  }

  setSlowStreaming(slow: boolean): void {
    this.controls.setSlow(slow);
  }

  private handleEvent(request: ActiveRequest, event: AiStreamEvent): void {
    if (!this.isActive(request)) {
      return;
    }
    switch (event.kind) {
      case 'started':
        request.type = event.type;
        request.severity = event.severity;
        this.store.startStreaming(request.order, request.id, event.type, event.severity);
        break;
      case 'chunk':
        this.store.appendChunk(request.id, event.content);
        break;
      case 'empty':
        this.store.setEmpty(request.order, event.generatedAt);
        break;
      case 'completed':
        this.completeRecommendation(request, event.generatedAt);
        break;
    }
  }

  private completeRecommendation(request: ActiveRequest, generatedAt: Date): void {
    const state = this.state();
    if (
      state.status !== 'streaming' ||
      request.type === null ||
      request.severity === null ||
      !this.isActive(request)
    ) {
      return;
    }
    this.store.setSuccess({
      id: this.idGenerator.next('recommendation'),
      orderId: request.order.id,
      orderRevision: request.order.revision,
      type: request.type,
      severity: request.severity,
      content: state.partialContent.trim(),
      generatedAt,
      stale:
        this.selectedOrder?.id !== request.order.id ||
        this.selectedOrder.revision !== request.order.revision,
    });
  }

  private isActive(request: ActiveRequest): boolean {
    return this.activeRequest?.id === request.id && this.selectedOrder?.id === request.order.id;
  }

  private cancelStream(announceCancellation: boolean): void {
    const activeOrder = this.activeRequest?.order ?? null;
    this.streamSubscription?.unsubscribe();
    this.streamSubscription = null;
    this.activeRequest = null;
    if (announceCancellation && activeOrder !== null) {
      this.store.setCancelled(activeOrder);
    }
  }
}
