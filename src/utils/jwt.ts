import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate a short-lived access token (e.g. 7d)
 */
export const generateAccessToken = (user: IUser): string => {
  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Generate a long-lived refresh token (e.g. 30d)
 */
export const generateRefreshToken = (user: IUser): string => {
  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Verify an access token and return the decoded payload
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
};

/**
 * Verify a refresh token and return the decoded payload
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;
};

/**
 * Attach refresh token as an HttpOnly cookie
 */
export const setRefreshTokenCookie = (
  res: import('express').Response,
  token: string
): void => {
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: thirtyDays,
    path: '/api/auth/refresh',
  });
};

/**
 * Clear the refresh token cookie
 */
export const clearRefreshTokenCookie = (res: import('express').Response): void => {
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
};
