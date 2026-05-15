import 'dotenv/config';
import connectDB from './config/mongodb';
import createServer from './server';

const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async (): Promise<void> => {
  // Connect to MongoDB first
  await connectDB();

  const app = createServer();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Environment  : ${process.env.NODE_ENV}`);
    console.log(`🔗 Health check : http://localhost:${PORT}/health`);
    console.log(`🔐 Auth API     : http://localhost:${PORT}/api/auth\n`);
  });

  // ─── Graceful shutdown ──────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
    server.close(() => process.exit(1));
  });
};

startServer();
