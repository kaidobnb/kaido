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
  category: 'crypto' | 'sports' | 'realworld'; // New field to distinguish prediction types
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
  resolvedBy?: 'api' | 'admin' | 'agent'; // Who resolved the prediction
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
  // KAIDO Agent metadata
  isAgentCreated?: boolean;
  finalPrice?: number;
  // Oracle data for real-world events
  oracleData?: {
    requiresOracle: boolean;
    eventType: string; // e.g., "election_result", "movie_award", "product_launch"
    claim: string; // The claim to verify
    schema?: {
      description: string;
      fields: Record<string, { type: string; description: string }>;
    };
    verificationProofId?: mongoose.Types.ObjectId;
    suggestedSources?: string[]; // Suggested URLs for verification
  };
}

const PredictionSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          const doc = this as any;

          // For crypto binary predictions, ensure title includes target price or clear question
          if (doc.category === 'crypto' && doc.type === 'binary') {
            // Title should either contain a price (e.g., "$100,000") or be a clear question
            const hasPrice = /\$[\d,]+/.test(v);
            const hasQuestion = /will|reach|above|below|higher|lower/i.test(v);
            return hasPrice || hasQuestion;
          }

          // For sports predictions, ensure title includes team names or is specific
          if (doc.category === 'sports') {
            // Reject generic titles
            const genericTitles = [
              'match outcome prediction',
              'match prediction',
              'game prediction',
              'sports prediction'
            ];
            const lowerTitle = v.toLowerCase();
            const isGeneric = genericTitles.some(generic => lowerTitle === generic);

            if (isGeneric) {
              return false;
            }

            // Title should include "vs" or team names from sportsData
            const hasVs = /\svs\s/i.test(v);
            return hasVs || v.length > 20; // Allow longer descriptive titles
          }

          return true;
        },
        message: function(props: any) {
          const doc = props.instance as any;
          if (doc.category === 'crypto') {
            return 'Crypto binary predictions must have a clear target price or question in the title';
          }
          if (doc.category === 'sports') {
            return 'Sports predictions must have specific titles with team names (e.g., "Team A vs Team B - Match Outcome"), not generic titles like "Match outcome prediction"';
          }
          return 'Invalid title';
        }
      }
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long']
    },
    type: {
      type: String,
      enum: ['binary', 'multiple', 'agent'],
      required: true,
      validate: {
        validator: function(v: string) {
          const doc = this as any;
          // Sports predictions cannot be binary (must account for draws)
          if (doc.category === 'sports' && v === 'binary') {
            return false;
          }
          return true;
        },
        message: 'Sports predictions cannot be binary type. Use multiple-choice to account for draws (Home Win, Draw, Away Win).'
      }
    },
    category: {
      type: String,
      enum: ['crypto', 'sports', 'realworld'],
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
      validate: {
        validator: function(v: Date) {
          return v > new Date();
        },
        message: 'End date must be in the future'
      }
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
      minlength: [20, 'Resolution details must be at least 20 characters long']
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
      enum: ['api', 'admin', 'agent'],
    },
    asset: {
      type: String,
      required: true,
    },
    targetPrice: {
      type: Number,
      validate: {
        validator: function(v: number | undefined) {
          const doc = this as any;
          // For crypto binary predictions, targetPrice is required
          if (doc.category === 'crypto' && doc.type === 'binary') {
            return v !== undefined && v > 0;
          }
          return true;
        },
        message: 'Target price is required for crypto binary predictions and must be greater than 0'
      }
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
      finalHomeScore: {
        type: Number,
      },
      finalAwayScore: {
        type: Number,
      },
    },
    // KAIDO Agent metadata
    isAgentCreated: {
      type: Boolean,
      default: false,
    },
    finalPrice: {
      type: Number,
    },
    // Oracle data for real-world events
    oracleData: {
      requiresOracle: {
        type: Boolean,
        default: false,
      },
      eventType: {
        type: String,
      },
      claim: {
        type: String,
      },
      schema: {
        description: String,
        fields: Schema.Types.Mixed,
      },
      verificationProofId: {
        type: Schema.Types.ObjectId,
        ref: 'VerificationProof',
      },
      suggestedSources: [String],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPrediction>('Prediction', PredictionSchema);
