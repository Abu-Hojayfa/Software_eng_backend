import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import { errorHandler, notFound } from './middleware/errorHandler';

const createServer = (): Application => {
  const app = express();

  // ─── Security headers ─────────────────────────────────────────────────────
  app.use(helmet());

  // ─── CORS ─────────────────────────────────────────────────────────────────
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:3000'
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. Postman, mobile apps)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
      },
      credentials: true, // Needed for cookies (refresh token)
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ─── Body parsing ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ─── Logging ──────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // ─── Health check ─────────────────────────────────────────────────────────
  app.get('/health', (_, res) => {
    res.status(200).json({
      success: true,
      message: 'Government Transparency Platform API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  });

  // ─── API Routes ───────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);

  // Future routes (add here as you build them):
  // app.use('/api/users', userRoutes);
  // app.use('/api/records', recordRoutes);
  // app.use('/api/requests', requestRoutes);

  // ─── Error handling ───────────────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createServer;
