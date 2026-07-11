export type ConnectivityMode = 'online' | 'offline' | 'unstable';

export function isConnectivityMode(value: unknown): value is ConnectivityMode {
  return value === 'online' || value === 'offline' || value === 'unstable';
}

export type ConnectivityState = Readonly<{
  mode: ConnectivityMode;
  isOnline: boolean;
  changedAt: Date;
}>;
