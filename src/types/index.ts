import { Request } from 'express';

// ── User roles ────────────────────────────────────────────────────────────────
export type UserRole = 'citizen' | 'official' | 'journalist' | 'auditor' | 'admin';

// ── Authenticated request — req.user is attached by the protect middleware ───
export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

// ── JWT payload shape ─────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// ── Standard API response shapes ─────────────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true;
  message: string;
  data?: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}
