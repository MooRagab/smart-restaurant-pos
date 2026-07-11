export type ConnectivityMode = 'online' | 'offline' | 'unstable';

export type ConnectivityState = Readonly<{
  mode: ConnectivityMode;
  isOnline: boolean;
  changedAt: Date;
}>;
