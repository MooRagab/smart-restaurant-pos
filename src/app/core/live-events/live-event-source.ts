import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export type LiveEvent<TType extends string = string, TPayload = unknown> = Readonly<{
  id: string;
  type: TType;
  occurredAt: Date;
  payload: TPayload;
}>;

export type LiveEventSource<TEvent extends LiveEvent = LiveEvent> = {
  readonly events$: Observable<TEvent>;
  start(): void;
  stop(): void;
};

export const LIVE_EVENT_SOURCE = new InjectionToken<LiveEventSource>('LIVE_EVENT_SOURCE');
