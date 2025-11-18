import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define user badge interface
export interface IUserBadge {
  badgeId: mongoose.Types.ObjectId;
  dateAwarded: Date;
  progress?: number; // For badges with progress tracking
}

// Define the base user interface without Document extension
export interface IUserBase {
  walletAddress: string;
  username?: string;
  email?: string;
  displayName?: string;
  profileCompleted: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  bio?: string;
  balances: {
    SOL: number;
    SOLY: number;
    BNB: number;
    KAIDO: number;
  };
  reputation: number;
  winRate: number;
  totalPredictions: number;
  wonPredictions: number;
  totalVolume: number;
  claimedWinnings: number;
  isAdmin: boolean;
  isSubAdmin: boolean;
  referralCode?: string;
  referredBy?: mongoose.Types.ObjectId;
  badges: IUserBadge[];
  badgeNotifications: boolean; // Whether user has unread badge notifications
  notifications?: Array<{
    userId: mongoose.Types.ObjectId;
    type: string;
    title: string;
    message: string;
    timestamp?: Date;
    read: boolean;
    predictionId?: mongoose.Types.ObjectId;
    data?: any;
  }>;
}

// Extend Document with our base interface
export interface IUser extends Document, IUserBase {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    balances: {
      SOL: {
        type: Number,
        default: 0,
      },
      SOLY: {
        type: Number,
        default: 0,
      },
      BNB: {
        type: Number,
        default: 0,
      },
      KAIDO: {
        type: Number,
        default: 0,
      },
    },
    reputation: {
      type: Number,
      default: 0,
    },
    winRate: {
      type: Number,
      default: 0,
    },
    totalPredictions: {
      type: Number,
      default: 0,
    },
    wonPredictions: {
      type: Number,
      default: 0,
    },
    totalVolume: {
      type: Number,
      default: 0,
    },
    claimedWinnings: {
      type: Number,
      default: 0,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isSubAdmin: {
      type: Boolean,
      default: false,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    badges: [{
      badgeId: {
        type: Schema.Types.ObjectId,
        ref: 'Badge',
      },
      dateAwarded: {
        type: Date,
        default: Date.now,
      },
      progress: {
        type: Number,
        default: 0,
      },
    }],
    badgeNotifications: {
      type: Boolean,
      default: false,
    },
    notifications: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      type: {
        type: String,
        enum: ['winnings', 'prediction_resolved', 'prediction_created', 'comment', 'system', 'prediction_win', 'prediction_loss', 'new_comment', 'reward_claim', 'referral_bonus', 'referral'],
        default: 'system'
      },
      title: {
        type: String,
        required: true
      },
      message: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      read: {
        type: Boolean,
        default: false
      },
      predictionId: {
        type: Schema.Types.ObjectId,
        ref: 'Prediction'
      },
      data: {
        type: Schema.Types.Mixed
      }
    }],
  },
  {
    timestamps: true,
  }
);

// Method to compare password (not used with wallet authentication but kept for future use)
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
