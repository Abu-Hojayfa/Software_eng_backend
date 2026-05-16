import { Application } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

export const registerRoutes = (app: Application): void => {
  app.use('/api/auth',  authRoutes);
  app.use('/api/users', userRoutes);

  // Add future route groups here:
  // app.use('/api/records',  recordRoutes);
  // app.use('/api/requests', requestRoutes);
};
