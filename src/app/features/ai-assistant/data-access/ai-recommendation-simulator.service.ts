import { Injectable } from '@angular/core';
import { Observable, concat, map, mergeMap, of, throwError, timer } from 'rxjs';

import { AppError } from '../../../shared/types/app-error';
import { Order } from '../../orders/domain/order.model';
import {
  AiRecommendationSeverity,
  AiRecommendationType,
  AiSimulationOptions,
  AiStreamEvent,
} from '../domain/ai-recommendation.model';

type RecommendationTemplate = Readonly<{
  type: AiRecommendationType;
  severity: AiRecommendationSeverity;
  content: string;
}>;

@Injectable()
export class AiRecommendationSimulatorService {
  generate(order: Order, options: AiSimulationOptions): Observable<AiStreamEvent> {
    const template = selectTemplate(order);
    const outcome = resolveOutcome(order.id, options.outcome);
    const firstDelay = options.slow ? 1_500 : 500;
    const chunkDelay = options.slow ? 900 : 280;

    if (outcome === 'failure') {
      const error: AppError = {
        code: 'simulation',
        message: 'The AI assistant could not analyze this order. Please retry.',
        retryable: true,
        technicalMessage: `Simulated AI failure for ${order.id}`,
      };
      return concat(
        timer(firstDelay).pipe(
          map((): AiStreamEvent => ({
            kind: 'started',
            type: template.type,
            severity: template.severity,
          })),
        ),
        timer(chunkDelay).pipe(mergeMap(() => throwError(() => error))),
      );
    }

    if (outcome === 'empty') {
      return concat(
        timer(firstDelay).pipe(
          map((): AiStreamEvent => ({
            kind: 'started',
            type: template.type,
            severity: template.severity,
          })),
        ),
        timer(chunkDelay).pipe(
          map((): AiStreamEvent => ({ kind: 'empty', generatedAt: new Date() })),
        ),
      );
    }

    const chunks = splitIntoChunks(template.content);
    return concat(
      timer(firstDelay).pipe(
        map((): AiStreamEvent => ({
          kind: 'started',
          type: template.type,
          severity: template.severity,
        })),
      ),
      ...chunks.map((content) =>
        timer(chunkDelay).pipe(map((): AiStreamEvent => ({ kind: 'chunk', content }))),
      ),
      of<AiStreamEvent>({ kind: 'completed', generatedAt: new Date() }),
    );
  }
}

function resolveOutcome(
  orderId: string,
  configured: AiSimulationOptions['outcome'],
): Exclude<AiSimulationOptions['outcome'], 'auto'> {
  if (configured !== 'auto') {
    return configured;
  }
  const orderNumber = Number(orderId.replace(/\D/g, ''));
  if (orderNumber % 11 === 0) {
    return 'failure';
  }
  if (orderNumber % 7 === 0) {
    return 'empty';
  }
  return 'success';
}

function selectTemplate(order: Order): RecommendationTemplate {
  if (order.isDelayed) {
    return {
      type: 'kitchen-overload',
      severity: 'critical',
      content:
        'Kitchen pressure is affecting this order. Prioritize packaging and confirm the revised preparation time with the customer.',
    };
  }
  if (order.channel === 'delivery') {
    return {
      type: 'delivery-risk',
      severity: 'warning',
      content:
        'Delivery timing may affect food quality. Seal hot and cold items separately and request a rider before the order reaches Ready.',
    };
  }
  if (order.items.some((item) => item.notes !== undefined)) {
    return {
      type: 'missing-information',
      severity: 'warning',
      content:
        'An item includes a special note. Confirm the requested modification with the guest before preparation begins.',
    };
  }

  const orderNumber = Number(order.id.replace(/\D/g, ''));
  if (orderNumber % 3 === 0) {
    return {
      type: 'allergy-warning',
      severity: 'critical',
      content:
        'Ask the guest about sesame and dairy allergies before serving. The selected meal may contain tahini or milk-based ingredients.',
    };
  }
  return {
    type: 'upselling',
    severity: 'suggestion',
    content:
      'Suggest adding Karkadeh or Roz Bel Laban to complete the meal. Both pair well with the selected Egyptian dishes.',
  };
}

function splitIntoChunks(content: string): readonly string[] {
  const words = content.split(' ');
  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += 5) {
    chunks.push(`${words.slice(index, index + 5).join(' ')} `);
  }
  return chunks;
}
