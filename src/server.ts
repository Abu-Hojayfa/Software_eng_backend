import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { registerRoutes } from './routes';
import { notFound, errorHandler } from './middleware/errorHandler';

const createApp = (): Application => {
  const app = express();

  // ── Security ────────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({
    origin: (origin, cb) => {
      const allowed = [
        process.env.CLIENT_URL ?? 'http://localhost:5173',
        'http://localhost:3000',
      ];
      if (!origin || allowed.includes(origin)) cb(null, true);
      else cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials:    true,
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ── Parsing ─────────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ── Logging ─────────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) =>
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() })
  );

  // ── API routes ───────────────────────────────────────────────────────────────
  registerRoutes(app);

  // ── Error handling (must be last) ────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
