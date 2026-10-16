export interface AppError extends Error {
  code?: string | number;
  errno?: number;
  response?: {
    data?: {
      message?: string;
    };
  };
}
