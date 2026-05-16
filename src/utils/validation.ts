import { Request } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../types';

/**
 * Returns a formatted array of field errors, or null if the request is valid.
 */
export const extractErrors = (req: Request): ValidationError[] | null => {
  const result = validationResult(req);
  if (result.isEmpty()) return null;

  return result.array().map((err) => ({
    field:   'path' in err ? (err.path as string) : 'unknown',
    message: err.msg as string,
  }));
};
