import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, string[]>) {
    super(400, 'VALIDATION_ERROR', 'Validation failed', details);
  }
}

export class AuthenticationError extends AppError {
  constructor() {
    super(401, 'AUTHENTICATION_ERROR', 'Invalid credentials');
  }
}

export class AuthorizationError extends AppError {
  constructor() {
    super(403, 'AUTHORIZATION_ERROR', 'Access denied');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ConflictError extends AppError {
  public data?: Record<string, unknown>;
  
  constructor(message: string, data?: Record<string, unknown>) {
    super(409, 'CONFLICT', message);
    this.data = data;
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ConflictError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      data: err.data,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  console.error('Unexpected error:', err);

  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
};
