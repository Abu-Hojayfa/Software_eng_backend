import { Response } from 'express';

interface SuccessResponse {
  success: true;
  message: string;
  data?: unknown;
  meta?: Record<string, unknown>;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
}

export const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data?: unknown,
  meta?: Record<string, unknown>
): Response<SuccessResponse> => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown
): Response<ErrorResponse> => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== undefined && { errors }),
  });
};
