import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { IUser } from '../models/User';
import { JwtPayload } from '../types';
import { COOKIE } from '../constants';

// ── Token generation ──────────────────────────────────────────────────────────

const buildPayload = (user: IUser): JwtPayload => ({
  userId: user._id.toString(),
  email:  user.email,
  role:   user.role,
});

export const generateAccessToken = (user: IUser): string =>
  jwt.sign(
    buildPayload(user),
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  );

export const generateRefreshToken = (user: IUser): string =>
  jwt.sign(
    buildPayload(user),
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as jwt.SignOptions['expiresIn'] }
  );

// ── Token verification ────────────────────────────────────────────────────────

export const verifyAccessToken  = (token: string): JwtPayload =>
  jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;

// ── Cookie helpers ────────────────────────────────────────────────────────────

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(COOKIE.REFRESH_TOKEN_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   COOKIE.MAX_AGE_MS,
    path:     COOKIE.REFRESH_TOKEN_PATH,
  });
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(COOKIE.REFRESH_TOKEN_NAME, { path: COOKIE.REFRESH_TOKEN_PATH });
};
