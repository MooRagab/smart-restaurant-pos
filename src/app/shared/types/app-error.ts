export type AppErrorCode =
  'connectivity' | 'invalid-operation' | 'not-found' | 'persistence' | 'simulation' | 'unexpected';

export type AppError = Readonly<{
  code: AppErrorCode;
  message: string;
  retryable: boolean;
  technicalMessage?: string;
}>;
