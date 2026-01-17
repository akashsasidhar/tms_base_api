import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Send success response
 */
export function success(
  res: Response,
  data: unknown,
  message: string = 'Success',
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send error response
 */
export function error(
  res: Response,
  message: string = 'An error occurred',
  statusCode: number = 500,
  errors?: string[]
): void {
  res.status(statusCode).json({
    success: false,
    message,
    errors: errors || [message],
  });
}

/**
 * Send paginated response
 */
export function paginated(
  res: Response,
  data: unknown[],
  meta: PaginationMeta,
  message: string = 'Success'
): void {
  res.status(200).json({
    success: true,
    message,
    data,
    meta,
  });
}
