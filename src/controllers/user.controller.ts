import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import { extractErrors } from '../utils/validation';
import { AuthenticatedRequest } from '../types';
import { PROFILE_UPDATABLE_FIELDS } from '../constants';

// ── Get profile ───────────────────────────────────────────────────────────────
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById((req as AuthenticatedRequest).user.userId).select('-password');
    if (!user) { sendError(res, 404, 'User not found.'); return; }
    sendSuccess(res, 200, 'Profile fetched successfully.', { user });
  } catch (err) { next(err); }
};

// ── Update profile ────────────────────────────────────────────────────────────
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = extractErrors(req);
    if (errors) { sendError(res, 422, 'Validation failed', errors); return; }

    // Whitelist — only allow safe fields, never role / password / isAdmin etc.
    const updates: Record<string, unknown> = {};
    for (const field of PROFILE_UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(
      (req as AuthenticatedRequest).user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) { sendError(res, 404, 'User not found.'); return; }
    sendSuccess(res, 200, 'Profile updated successfully.', { user });
  } catch (err) { next(err); }
};

// ── Change password ───────────────────────────────────────────────────────────
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = extractErrors(req);
    if (errors) { sendError(res, 422, 'Validation failed', errors); return; }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById((req as AuthenticatedRequest).user.userId).select('+password');
    if (!user) { sendError(res, 404, 'User not found.'); return; }

    const match = await user.comparePassword(currentPassword);
    if (!match) { sendError(res, 401, 'Current password is incorrect.'); return; }

    user.password = newPassword; // pre-save hook hashes it
    await user.save();

    sendSuccess(res, 200, 'Password changed successfully.');
  } catch (err) { next(err); }
};

// ── Delete (deactivate) account ───────────────────────────────────────────────
export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await User.findByIdAndUpdate((req as AuthenticatedRequest).user.userId, { isActive: false });
    sendSuccess(res, 200, 'Account deactivated successfully.');
  } catch (err) { next(err); }
};
