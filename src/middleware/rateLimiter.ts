import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../constants';

const makeMessage = (msg: string) => ({ success: false, message: msg });

export const loginLimiter = rateLimit({
  windowMs:       RATE_LIMIT.AUTH_WINDOW_MS,
  max:            RATE_LIMIT.AUTH_MAX,
  message:        makeMessage('Too many login attempts. Please try again in 15 minutes.'),
  standardHeaders: true,
  legacyHeaders:  false,
});

export const signupLimiter = rateLimit({
  windowMs:       RATE_LIMIT.SIGNUP_WINDOW_MS,
  max:            RATE_LIMIT.SIGNUP_MAX,
  message:        makeMessage('Too many registrations. Please try again in an hour.'),
  standardHeaders: true,
  legacyHeaders:  false,
});
