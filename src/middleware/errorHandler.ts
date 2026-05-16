import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export interface AppError extends Error {
  statusCode?: number;
}

// ── 404 ───────────────────────────────────────────────────────────────────────
export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const err: AppError = new Error(`Not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

// ── Global error handler ──────────────────────────────────────────────────────
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let status  = err.statusCode ?? 500;
  let message = err.message    ?? 'Internal Server Error';
  let errors: unknown;

  // Mongoose: duplicate key
  if ((err as { code?: number }).code === 11000) {
    status  = 409;
    const field = Object.keys((err as { keyValue?: Record<string, unknown> }).keyValue ?? {})[0];
    message = `${field ?? 'Field'} already exists.`;
  }

  // Mongoose: validation
  if (err instanceof mongoose.Error.ValidationError) {
    status  = 422;
    message = 'Validation failed';
    errors  = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  // Mongoose: bad ObjectId
  if (err instanceof mongoose.Error.CastError) {
    status  = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT
  if (err.name === 'JsonWebTokenError') { status = 401; message = 'Invalid token.'; }
  if (err.name === 'TokenExpiredError') { status = 401; message = 'Token expired. Please log in again.'; }

  if (process.env.NODE_ENV !== 'production') console.error('❌', err);

  const body: Record<string, unknown> = { success: false, message };
  if (errors) body.errors = errors;
  if (process.env.NODE_ENV === 'development') body.stack = err.stack;

  res.status(status).json(body);
};
