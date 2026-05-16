import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types';

// ── Document interface ────────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  location?: string;
  organization?: string;
  nationalId?: string;
  profileImage?: string;
  isVerified: boolean;
  isApproved: boolean;
  isActive: boolean;
  lastLogin?: Date;
  reportsSubmitted: number;
  reportsResolved: number;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidate: string): Promise<boolean>;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['citizen', 'official', 'journalist', 'auditor', 'admin'],
      default: 'citizen',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[\d\s\-()]{7,20}$/, 'Please provide a valid phone number'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    organization: {
      type: String,
      trim: true,
      maxlength: [200, 'Organization cannot exceed 200 characters'],
    },
    nationalId: {
      type: String,
      trim: true,
      sparse: true,
    },
    profileImage: { type: String, default: null },
    isVerified:   { type: Boolean, default: false },
    isApproved:   { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    lastLogin:    { type: Date, default: null },
    reportsSubmitted: { type: Number, default: 0 },
    reportsResolved:  { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ role: 1, isApproved: 1 });

// ── Hooks ─────────────────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

userSchema.pre('save', function (next) {
  // Citizens are auto-approved on creation; all other roles need admin approval
  if (this.isNew && this.role === 'citizen') this.isApproved = true;
  next();
});

// ── Methods ───────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model<IUser>('User', userSchema);
