import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');

  const conn = await mongoose.connect(uri, { autoIndex: true });
  console.log(`✅ MongoDB connected: ${conn.connection.host}`);

  mongoose.connection.on('error', (err) =>
    console.error(`❌ MongoDB error: ${err}`)
  );
  mongoose.connection.on('disconnected', () =>
    console.warn('⚠️  MongoDB disconnected')
  );
};

export default connectDB;
