export type AppErrorCode =
  'connectivity' | 'invalid-operation' | 'not-found' | 'persistence' | 'simulation' | 'unexpected';

export type AppError = Readonly<{
  code: AppErrorCode;
  message: string;
  retryable: boolean;
  technicalMessage?: string;
}>;

export function isAppError(value: unknown): value is AppError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return (
    'code' in value &&
    'message' in value &&
    'retryable' in value &&
    isAppErrorCode(value.code) &&
    typeof value.message === 'string' &&
    typeof value.retryable === 'boolean' &&
    (!('technicalMessage' in value) || typeof value.technicalMessage === 'string')
  );
}

function isAppErrorCode(value: unknown): value is AppErrorCode {
  return (
    value === 'connectivity' ||
    value === 'invalid-operation' ||
    value === 'not-found' ||
    value === 'persistence' ||
    value === 'simulation' ||
    value === 'unexpected'
  );
}
