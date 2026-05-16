import 'dotenv/config';
import connectDB from './config/db';
import createApp from './server';

const PORT = parseInt(process.env.PORT ?? '5000', 10);

const start = async (): Promise<void> => {
  await connectDB();

  const app    = createApp();
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server  : http://localhost:${PORT}`);
    console.log(`🔗 Health  : http://localhost:${PORT}/health`);
    console.log(`🔐 Auth    : http://localhost:${PORT}/api/auth`);
    console.log(`👤 Users   : http://localhost:${PORT}/api/users\n`);
  });

  const shutdown = (sig: string) => {
    console.log(`\n${sig} received — shutting down`);
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    server.close(() => process.exit(1));
  });
};

start();
