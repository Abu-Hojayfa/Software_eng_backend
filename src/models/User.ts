import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Roles for Government Transparency Platform:
// - citizen      : Regular public user — can view public records, submit requests
// - official     : Government official — can manage their ministry's data
// - admin        : Super admin — full access, manages users & platform
// - journalist   : Verified press — can access press-level data
// - auditor      : Independent auditor — read-only access to all data

export type UserRole = 'citizen' | 'official' | 'journalist' | 'auditor' | 'admin';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  nationalId?: string;          // For citizens/officials (NID verification)
  organization?: string;        // Ministry / News org / Audit firm
  phone?: string;
  profileImage?: string;
  isVerified: boolean;          // Email verification
  isApproved: boolean;          // Admin approval (for non-citizen roles)
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

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
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password by default
    },
    role: {
      type: String,
      enum: ['citizen', 'official', 'journalist', 'auditor', 'admin'],
      default: 'citizen',
    },
    nationalId: {
      type: String,
      trim: true,
      sparse: true, // Allows null but enforces uniqueness when present
    },
    organization: {
      type: String,
      trim: true,
      maxlength: [200, 'Organization name cannot exceed 200 characters'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[\d\s\-()]{7,20}$/, 'Please provide a valid phone number'],
    },
    profileImage: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      // Citizens are auto-approved; others need admin approval
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isApproved: 1, role: 1 });

// ─── Pre-save: hash password ────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next();

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ─── Pre-save: auto-approve citizens ────────────────────────────────────────
userSchema.pre('save', function (next) {
  if (this.isNew && this.role === 'citizen') {
    this.isApproved = true;
  }
  next();
});

// ─── Instance method: compare password ──────────────────────────────────────
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Override toJSON: strip sensitive fields ─────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
