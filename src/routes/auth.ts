import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

import User, { UserRole } from '../models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { protect } from '../middleware/auth';

const router = Router();

// ─── Rate limiters ──────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many accounts created. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Validation rules ────────────────────────────────────────────────────────

const signupValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  body('role')
    .optional()
    .isIn(['citizen', 'official', 'journalist', 'auditor'])
    .withMessage('Invalid role. Allowed: citizen, official, journalist, auditor'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-()]{7,20}$/).withMessage('Please provide a valid phone number'),

  body('organization')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Organization name cannot exceed 200 characters'),

  body('nationalId')
    .optional()
    .trim()
    .notEmpty().withMessage('National ID cannot be empty if provided'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ─── Helper: format validation errors ────────────────────────────────────────
const extractValidationErrors = (req: Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errors.array().map((err) => ({
      field: 'path' in err ? err.path : 'unknown',
      message: err.msg,
    }));
  }
  return null;
};

// ─── POST /api/auth/signup ───────────────────────────────────────────────────
/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/signup',
  signupLimiter,
  signupValidation,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate inputs
      const validationErrors = extractValidationErrors(req);
      if (validationErrors) {
        sendError(res, 422, 'Validation failed', validationErrors);
        return;
      }

      const {
        fullName,
        email,
        password,
        role = 'citizen' as UserRole,
        phone,
        organization,
        nationalId,
      } = req.body;

      // Prevent admin self-registration
      if (role === 'admin') {
        sendError(res, 403, 'Admin accounts cannot be created via this endpoint.');
        return;
      }

      // Check if email already registered
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        sendError(res, 409, 'An account with this email already exists.');
        return;
      }

      // Create user (password is hashed in pre-save hook)
      const user = await User.create({
        fullName,
        email,
        password,
        role,
        phone,
        organization,
        nationalId,
      });

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Set refresh token as secure HttpOnly cookie
      setRefreshTokenCookie(res, refreshToken);

      sendSuccess(res, 201, 'Account created successfully.', {
        accessToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isApproved: user.isApproved,
          organization: user.organization,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── POST /api/auth/login ────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  loginValidation,
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Find user with password
      const user = await User.findOne({ email }).select('+password');

      const invalidCredentialsMsg = 'Invalid email or password';

      // User not found
      if (!user) {
        sendError(res, 401, invalidCredentialsMsg);
        return;
      }

      // Account inactive
      if (!user.isActive) {
        sendError(
          res,
          403,
          'Your account has been deactivated'
        );
        return;
      }

      // Compare password
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        sendError(res, 401, invalidCredentialsMsg);
        return;
      }

      // Update login time
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Set refresh token cookie
      setRefreshTokenCookie(res, refreshToken);

      // Send response
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken,
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            isApproved: user.isApproved,
            organization: user.organization,
            lastLogin: user.lastLogin,
          },
        },
      });

    } catch (error) {
      next(error);
    }
  }
);

// ─── POST /api/auth/logout ───────────────────────────────────────────────────
/**
 * @route   POST /api/auth/logout
 * @desc    Logout — clear refresh token cookie
 * @access  Private
 */
router.post('/logout', protect, (req: Request, res: Response): void => {
  clearRefreshTokenCookie(res);
  sendSuccess(res, 200, 'Logged out successfully.');
});

// ─── POST /api/auth/refresh ──────────────────────────────────────────────────
/**
 * @route   POST /api/auth/refresh
 * @desc    Issue a new access token using refresh token cookie
 * @access  Public (uses cookie)
 */
router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.refreshToken;

      if (!token) {
        sendError(res, 401, 'Refresh token not found. Please log in again.');
        return;
      }

      let decoded;
      try {
        decoded = verifyRefreshToken(token);
      } catch {
        clearRefreshTokenCookie(res);
        sendError(res, 401, 'Refresh token is invalid or expired. Please log in again.');
        return;
      }

      const user = await User.findById(decoded.userId).select('_id email role isActive');
      if (!user || !user.isActive) {
        clearRefreshTokenCookie(res);
        sendError(res, 401, 'User not found or deactivated.');
        return;
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);
      setRefreshTokenCookie(res, newRefreshToken);

      sendSuccess(res, 200, 'Token refreshed.', { accessToken: newAccessToken });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private
 */
router.get(
  '/me',
  protect,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await User.findById(req.user!.userId).select(
        '-password -__v'
      );

      if (!user) {
        sendError(res, 404, 'User not found.');
        return;
      }

      sendSuccess(res, 200, 'User profile fetched.', { user });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
