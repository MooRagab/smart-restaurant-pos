import { ConnectivityMode } from '../../../shared/types/connectivity';

export type SimulationCommand =
  | Readonly<{ type: 'orders.add' }>
  | Readonly<{ type: 'orders.status-update' }>
  | Readonly<{ type: 'orders.payment-update' }>
  | Readonly<{ type: 'kitchen.increase' }>
  | Readonly<{ type: 'kitchen.decrease' }>
  | Readonly<{ type: 'ai.force-success' }>
  | Readonly<{ type: 'ai.force-failure' }>
  | Readonly<{ type: 'connectivity.set'; mode: ConnectivityMode }>
  | Readonly<{ type: 'queue.synchronize' }>
  | Readonly<{ type: 'mock.reset' }>;
