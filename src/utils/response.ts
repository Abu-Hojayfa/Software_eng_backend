import { Response } from 'express';
import { ApiSuccess, ApiError, ValidationError } from '../types';

export const sendSuccess = <T>(
  res: Response,
  status: number,
  message: string,
  data?: T
): Response<ApiSuccess<T>> =>
  res.status(status).json({ success: true, message, ...(data !== undefined && { data }) });

export const sendError = (
  res: Response,
  status: number,
  message: string,
  errors?: ValidationError[]
): Response<ApiError> =>
  res.status(status).json({ success: false, message, ...(errors && { errors }) });
