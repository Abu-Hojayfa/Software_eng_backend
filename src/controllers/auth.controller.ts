import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { extractErrors } from '../utils/validation';
import { AuthenticatedRequest, UserRole } from '../types';

// ── Signup ────────────────────────────────────────────────────────────────────
export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = extractErrors(req);
    if (errors) { sendError(res, 422, 'Validation failed', errors); return; }

    const { fullName, email, password, role = 'citizen' as UserRole, phone, organization, nationalId } = req.body;

    if (role === 'admin') {
      sendError(res, 403, 'Admin accounts cannot be self-registered.');
      return;
    }

    const exists = await User.findOne({ email });
    if (exists) { sendError(res, 409, 'An account with this email already exists.'); return; }

    const user = await User.create({ fullName, email, password, role, phone, organization, nationalId });

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);

    sendSuccess(res, 201, 'Account created successfully.', {
      accessToken,
      user: {
        id:           user._id,
        fullName:     user.fullName,
        email:        user.email,
        role:         user.role,
        isVerified:   user.isVerified,
        isApproved:   user.isApproved,
        organization: user.organization,
        createdAt:    user.createdAt,
      },
    });
  } catch (err) { next(err); }
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = extractErrors(req);
    if (errors) { sendError(res, 422, 'Validation failed', errors); return; }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    const INVALID = 'Invalid email or password.';

    if (!user)          { sendError(res, 401, INVALID); return; }
    if (!user.isActive) { sendError(res, 403, 'Your account has been deactivated. Contact support.'); return; }

    const match = await user.comparePassword(password);
    if (!match) { sendError(res, 401, INVALID); return; }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);

    sendSuccess(res, 200, 'Login successful.', {
      accessToken,
      user: {
        id:           user._id,
        fullName:     user.fullName,
        email:        user.email,
        role:         user.role,
        isVerified:   user.isVerified,
        isApproved:   user.isApproved,
        organization: user.organization,
        lastLogin:    user.lastLogin,
      },
    });
  } catch (err) { next(err); }
};

// ── Logout ────────────────────────────────────────────────────────────────────
export const logout = (_req: Request, res: Response): void => {
  clearRefreshTokenCookie(res);
  sendSuccess(res, 200, 'Logged out successfully.');
};

// ── Refresh token ─────────────────────────────────────────────────────────────
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) { sendError(res, 401, 'Refresh token not found. Please log in again.'); return; }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      clearRefreshTokenCookie(res);
      sendError(res, 401, 'Refresh token expired or invalid. Please log in again.');
      return;
    }

    const user = await User.findById(decoded.userId).select('_id email role isActive');
    if (!user || !user.isActive) {
      clearRefreshTokenCookie(res);
      sendError(res, 401, 'User not found or deactivated.');
      return;
    }

    const newAccess  = generateAccessToken(user);
    const newRefresh = generateRefreshToken(user);
    setRefreshTokenCookie(res, newRefresh);

    sendSuccess(res, 200, 'Token refreshed.', { accessToken: newAccess });
  } catch (err) { next(err); }
};

// ── Me ────────────────────────────────────────────────────────────────────────
export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById((req as AuthenticatedRequest).user.userId).select('-password');
    if (!user) { sendError(res, 404, 'User not found.'); return; }
    sendSuccess(res, 200, 'Profile fetched.', { user });
  } catch (err) { next(err); }
};
