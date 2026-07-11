import { AppError } from './app-error';

export type AsyncState<T> =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'success'; data: T }>
  | Readonly<{ status: 'empty' }>
  | Readonly<{ status: 'error'; error: AppError }>;

export type StreamingState<T> =
  | AsyncState<T>
  | Readonly<{ status: 'streaming'; partialData: T }>
  | Readonly<{ status: 'cancelled' }>;
