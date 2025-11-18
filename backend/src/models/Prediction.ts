import mongoose, { Document, Schema } from 'mongoose';

export interface PredictionChoice {
  id: string;
  label: string;
  price: number;
  percentage: number;
}

export interface SportsData {
  matchId: string;
  competitionId: string;
  competitionName: string;
  homeTeam: {
    id: string;
    name: string;
    country: string;
  };
  awayTeam: {
    id: string;
    name: string;
    country: string;
  };
  scheduledDate: Date;
  sport: 'soccer'; // Extensible for future sports
  autoResolve: boolean;
  resolutionCriteria: string; // How to resolve (e.g., "full_time_result", "total_goals")
}

export interface IPrediction extends Document {
  title: string;
  description: string;
  type: 'binary' | 'multiple' | 'agent';
  category: 'crypto' | 'sports'; // New field to distinguish prediction types
  tokenType: 'SOL' | 'SOLY' | 'BNB' | 'KAIDO';
  creator: mongoose.Types.ObjectId;
  createdAt: Date;
  endDate: Date;
  duration?: number; // Duration in minutes
  volume: number;
  participants: number;
  choices: PredictionChoice[];
  resolveDetails: string;
  status: 'active' | 'resolved' | 'cancelled';
  resolvedChoice?: string;
  resolvedAt?: Date;
  resolvedBy?: 'api' | 'admin'; // Who resolved the prediction
  asset: string;
  targetPrice?: number;
  priceRanges?: string[];
  stakeAmount: number;
  adminWallet?: string;
  transactionHash?: string; // Blockchain transaction hash for wallet funding
  onChainId?: number; // Smart contract prediction ID (if on-chain)
  fees?: {
    creation: number;
    resolution: number;
  };
  minSolyRequired?: number;
  maxParticipants?: number;
  rewardPoolAmount?: number; // Added for agent predictions
  sportsData?: SportsData; // Sports-specific data
}

const PredictionSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['binary', 'multiple', 'agent'],
      required: true,
    },
    category: {
      type: String,
      enum: ['crypto', 'sports'],
      default: 'crypto',
      required: true,
    },
    tokenType: {
      type: String,
      enum: ['SOL', 'SOLY', 'BNB', 'KAIDO'],
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // Duration in minutes
    },
    volume: {
      type: Number,
      default: 0,
    },
    participants: {
      type: Number,
      default: 0,
    },
    choices: [
      {
        id: String,
        label: String,
        price: Number,
        percentage: Number,
      },
    ],
    resolveDetails: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'cancelled'],
      default: 'active',
    },
    resolvedChoice: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: String,
      enum: ['api', 'admin'],
    },
    asset: {
      type: String,
      required: true,
    },
    targetPrice: {
      type: Number,
    },
    priceRanges: [String],
    stakeAmount: {
      type: Number,
      required: true,
    },
    adminWallet: {
      type: String,
    },
    transactionHash: {
      type: String,
    },
    onChainId: {
      type: Number,
    },
    fees: {
      creation: {
        type: Number,
        default: 0,
      },
      resolution: {
        type: Number,
        default: 0,
      },
    },
    minSolyRequired: {
      type: Number,
      default: 0,
    },
    maxParticipants: {
      type: Number,
    },
    rewardPoolAmount: {
      type: Number,
    },
    sportsData: {
      matchId: {
        type: String,
      },
      competitionId: {
        type: String,
      },
      competitionName: {
        type: String,
      },
      homeTeam: {
        id: String,
        name: String,
        country: String,
      },
      awayTeam: {
        id: String,
        name: String,
        country: String,
      },
      scheduledDate: {
        type: Date,
      },
      sport: {
        type: String,
        enum: ['soccer'],
        default: 'soccer',
      },
      autoResolve: {
        type: Boolean,
        default: true,
      },
      resolutionCriteria: {
        type: String,
        default: 'full_time_result',
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPrediction>('Prediction', PredictionSchema);
