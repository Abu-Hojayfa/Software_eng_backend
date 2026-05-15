import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import User, { UserRole } from '../models/User';
import { sendError } from '../utils/apiResponse';

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Protect: verify JWT and attach user to req.user
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 401, 'Access denied. No token provided.');
      return;
    }

    const token = authHeader.split(' ')[1];

    let decoded: JwtPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      sendError(res, 401, 'Invalid or expired token. Please log in again.');
      return;
    }

    // Confirm user still exists and is active
    const user = await User.findById(decoded.userId).select('_id email role isActive isApproved');
    if (!user || !user.isActive) {
      sendError(res, 401, 'User account not found or deactivated.');
      return;
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    sendError(res, 500, 'Authentication error. Please try again.');
  }
};

/**
 * Authorize: restrict access to specific roles
 * Usage: authorize('admin', 'official')
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required.');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        403,
        `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`
      );
      return;
    }

    next();
  };
};
