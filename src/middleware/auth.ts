import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { UserRole, AuthenticatedRequest } from '../types';

// ── Protect ───────────────────────────────────────────────────────────────────
// Verifies the Bearer token and attaches req.user
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 401, 'Access denied. No token provided.');
    return;
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    sendError(res, 401, 'Invalid or expired token. Please log in again.');
    return;
  }

  const user = await User.findById(decoded.userId).select('_id email role isActive');
  if (!user || !user.isActive) {
    sendError(res, 401, 'Account not found or deactivated.');
    return;
  }

  (req as AuthenticatedRequest).user = {
    userId: user._id.toString(),
    email:  user.email,
    role:   user.role,
  };

  next();
};

// ── Authorize ─────────────────────────────────────────────────────────────────
// Restricts the route to the given roles — must be used after protect
export const authorize = (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      sendError(res, 401, 'Authentication required.');
      return;
    }
    if (!roles.includes(user.role)) {
      sendError(res, 403, `Access denied. Required roles: ${roles.join(', ')}.`);
      return;
    }
    next();
  };
