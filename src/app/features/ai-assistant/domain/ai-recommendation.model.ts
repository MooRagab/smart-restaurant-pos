import { AppError } from '../../../shared/types/app-error';
import { OrderId } from '../../orders/domain/order.model';

export type AiRecommendationType =
  'upselling' | 'allergy-warning' | 'missing-information' | 'delivery-risk' | 'kitchen-overload';

export type AiRecommendationSeverity = 'info' | 'suggestion' | 'warning' | 'critical';

export type AiRecommendation = Readonly<{
  id: string;
  orderId: OrderId;
  orderRevision: number;
  type: AiRecommendationType;
  severity: AiRecommendationSeverity;
  content: string;
  generatedAt: Date;
  stale: boolean;
}>;

export type AiRecommendationState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'loading'; orderId: OrderId; requestId: string }>
  | Readonly<{
      status: 'streaming';
      orderId: OrderId;
      requestId: string;
      type: AiRecommendationType;
      severity: AiRecommendationSeverity;
      partialContent: string;
    }>
  | Readonly<{ status: 'success'; recommendation: AiRecommendation }>
  | Readonly<{ status: 'empty'; orderId: OrderId; generatedAt: Date }>
  | Readonly<{ status: 'error'; orderId: OrderId; error: AppError }>
  | Readonly<{ status: 'cancelled'; orderId: OrderId }>;

export type AiSimulationOutcome = 'auto' | 'success' | 'failure' | 'empty';

export type AiSimulationOptions = Readonly<{
  outcome: AiSimulationOutcome;
  slow: boolean;
}>;

export type AiStreamEvent =
  | Readonly<{
      kind: 'started';
      type: AiRecommendationType;
      severity: AiRecommendationSeverity;
    }>
  | Readonly<{ kind: 'chunk'; content: string }>
  | Readonly<{ kind: 'completed'; generatedAt: Date }>
  | Readonly<{ kind: 'empty'; generatedAt: Date }>;
